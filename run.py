# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import os
from flask import Flask, jsonify, request
import psycopg2
from psycopg2.extras import RealDictCursor
from flask_migrate import Migrate
from flask_minify import Minify
from sys import exit
from dotenv import load_dotenv
##added by avilash - 11-07-24
from flask import render_template, request
## 11-07-24 end
from apps import create_app, db
from apps.config import config_dict
from flask import current_app
import logging

# Load environment variables from .env file
load_dotenv()

# WARNING: Don't run with debug turned on in production!
DEBUG = (os.getenv('DEBUG', 'False') == 'True')

# The configuration
get_config_mode = 'Debug' if DEBUG else 'Production'

try:

    # Load the configuration using the default values
    app_config = config_dict[get_config_mode.capitalize()]

except KeyError:
    exit('Error: Invalid <config_mode>. Expected values [Debug, Production] ')
## new -- 16-07-24
# Load configuration
config_mode = 'Debug' if DEBUG else 'Production'
try:
    app_config = config_dict[config_mode.capitalize()]
except KeyError:
    exit('Error: Invalid <config_mode>. Expected values [Debug, Production]')

app = create_app(app_config)
#Migrate(app, db)

if not DEBUG:
    Minify(app=app, html=True, js=False, cssless=False)


def get_db_connection():
    return psycopg2.connect(
        host="datavistapostgresql.postgres.database.azure.com",
        database="DataVista",
        user="DataVistaInterns",
        password="Interns@2024"
    )

#Report Api - added by Pranita
@app.route('/api/report-data-table', methods=['GET'])
def report_data_table():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Get the page and limit parameters
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=20, type=int)
    offset = (page - 1) * limit

    query = """
        SELECT o.storeid, 
               o.orderid, 
               o.orderdate, 
               s.salespersonname, 
               p.productname, 
               p.category, 
               o.orderstatus, 
               o.profit, 
               o.quantity, 
               st.storelocation, 
               o.costofgoodssold, 
               o.paymentmethod
        FROM orders o
        JOIN products p ON o.productid = p.productid
        JOIN salesteam s ON o.salespersonid = s.salespersonid
        JOIN stores st ON o.storeid = st.storeid
        ORDER BY o.orderid ASC
        LIMIT %s OFFSET %s;
    """
    
    cur.execute(query, (limit, offset))
    result = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify(result)
#report api end


@app.route('/api/kpi-values', methods=['GET'])
def kpi_values():
    storeid = request.args.get('storeid', type=int)
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if storeid:

        query = """
            SELECT
                SUM(totalprice) AS total_sales,
                SUM(profit) AS total_profit,
                COUNT(orderid) AS total_orders,
                SUM(shippingcost) AS total_shipping,
                SUM(discount) AS total_discounts
            FROM
                orders;
            WHERE 
                storeid=%s
        """
        params = (storeid,)
    else:
        query = """
            SELECT
                SUM(totalprice) AS total_sales,
                SUM(profit) AS total_profit,
                COUNT(orderid) AS total_orders,
                SUM(shippingcost) AS total_shipping,
                SUM(discount) AS total_discounts
            FROM
                orders;
        """
        params = ()

    try:
        cur.execute(query)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify(result)

    
# PRATIKSHA -- IMPLEMENT PROFIT BY PRODUCT CATEGORY AND SUBCATEGORY
@app.route('/api/sales-manager/revenue_over_time', methods=['GET'])
def revenue_over_time_sales():
    storeid = request.args.get('storeid', type=int)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if storeid:
        query = """
        SELECT 
            products.category,
            products.subcategory,
            SUM(orders.profit) AS totalprofit
        FROM 
            orders
        JOIN 
            products ON orders.productid = products.productid
        WHERE 
            orders.storeid = %s
        GROUP BY 
            products.category, products.subcategory;
        """
        params = (storeid,)
    else:
        query = """
        SELECT 
            products.category,
            products.subcategory,
            SUM(orders.profit) AS totalprofit
        FROM 
            orders
        JOIN 
            products ON orders.productid = products.productid
        GROUP BY 
            products.category, products.subcategory;
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
# PRATIKSHA -- CODE END

#sirisha prathiksha code -- for order page sales -- 11/07/24
@app.route('/api/sales-manager/average-order-value-over-time', methods=['GET'])
def average_order_value_over_time():
    store_id = request.args.get('store_id', type=int)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    if store_id:
        query = """
        SELECT
            DATE_TRUNC('month', o.orderdate) AS order_month,
            AVG(o.totalprice) AS average_order_value
        FROM
            orders o
        WHERE
            o.storeid = %s
        GROUP BY
            order_month
        ORDER BY
            order_month;
        """
        params = (store_id,)
    else:
        query = """
        SELECT
            DATE_TRUNC('month', o.orderdate) AS order_month,
            AVG(o.totalprice) AS average_order_value
        FROM
            orders o
        GROUP BY
            order_month
        ORDER BY
            order_month;
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify(result)
#sirisha prathisha code end here

# SATTADIPAN -- Sales by Product Category and Sub Category
@app.route('/api/sales-manager/sales-by-category', methods=['GET'])
def sales_by_category_sales():
    store_id = request.args.get('store_id', type=int)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    if store_id:
        query = """
        SELECT
            p.category,
            p.subcategory,
            SUM(o.totalprice) AS totalsales
        FROM
            orders o
        JOIN
            products p ON o.productid = p.productid
        WHERE
            o.storeid = %s
        GROUP BY
            p.category,
            p.subcategory;
        """
        params = (store_id,)
    else:
        query = """
        SELECT
            p.category,
            p.subcategory,
            SUM(o.totalprice) AS totalsales
        FROM
            orders o
        JOIN
            products p ON o.productid = p.productid
        GROUP BY
            p.category,
            p.subcategory;
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify(result)
# SATTADIPAN CODE END


#  NITYA -- total sales over time -- sales manager
@app.route('/api/sales-manager/sales-over-time', methods=['GET'])
def sales_over_time():
    store_id = request.args.get('store_id', type=int)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
        # SQL query to retrieve total sales from order table grouped by ordered date and filtered by storeid.

    if store_id:
        query = """
        SELECT 
        OrderDate,
            SUM(totalprice) AS TotalSales
        FROM 
            orders
        WHERE 
            storeid = %s
        GROUP BY 
            orderdate
        ORDER BY 
            OrderDate
        """
        params = (store_id,)
    else:
        query = """
        SELECT 
        OrderDate,
            SUM(totalprice) AS TotalSales
        FROM 
            orders
        GROUP BY 
            orderdate
        ORDER BY 
            OrderDate
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)

# Nitya -- end

#PRANITA -- PROFIT MARGIN OVER TIME -- sales 
@app.route('/api/sales-manager/profit-margin-over-time', methods=['GET'])
def profit_margin_over_time_sales():
    store_id = request.args.get('store_id', type=int)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if store_id:
        # SQL query to sum profits grouped by orderdate for the specified store ID
        query = """
        SELECT
            orderdate,
            SUM(profit) AS TotalProfit
        FROM
            orders
        WHERE
            storeid = %s
        GROUP BY
            orderdate, storeid
        ORDER BY
            orderdate, storeid;
        """
        params = (store_id,)
    else:
        # SQL query to sum profits grouped by orderdate for all store IDs
        query = """
        SELECT
            orderdate,
            SUM(profit) AS TotalProfit
        FROM
            orders
        GROUP BY
            orderdate
        ORDER BY
            orderdate;
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)

# pranita code end --
# Satya Lakshmi -- code here for customer feedback sales

@app.route('/api/sales-manager/customer-feedback', methods=['GET'])
def customer_feedback_sales():
    store_id = request.args.get('store_id', type=int)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if store_id:
            query = """
            SELECT
                customerfeedback,
                COUNT(*) AS feedbackcount
            FROM
                orders
            WHERE
                storeid = %s
            GROUP BY
                customerfeedback
            ORDER BY
                customerfeedback;
            """
            params = (store_id,)
        else:
            query = """
            SELECT 
                customerfeedback,
                COUNT(*) AS feedbackcount
            FROM 
                orders
            GROUP BY 
                customerfeedback
            ORDER BY
                customerfeedback;
            """
            params = ()

        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
# satya code end here

#BALAKUMARI -- SALES MAPPING BY COUNTRY
@app.route('/api/sales-manager/sales-mapping-by-country', methods=['GET'])

def sales_mapping_by_country_sales():
    store_id = request.args.get('store_id', type=int)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if store_id:
        query = """
            SELECT
            Country,
                SUM(totalprice) AS TotalSales
            FROM orders
            WHERE storeid  = %s
            GROUP BY
                storelocation 
            ORDER BY 
                storelocation
        """
        params = (store_id,)
    else:
        query = """
            SELECT
            Country,
                SUM(totalprice) AS TotalSales
            FROM orders
            WHERE storeid  = %s
            GROUP BY
                storelocation 
            ORDER BY 
                storelocation
        """
        params = ()

    try:
        cur.execute(query)
        result = cur.fetchall()
        #return [{"SalesType": row[0], "TotalSales": row[1]} for row in result]
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
#BALLAKUMARI -- END

# RAJESH -- DISCOUNT AND PROMOTION -- SALES
@app.route('/api/sales-manager/discounts-promotions', methods=['GET'])
def get_discounts_promotions_sales():
    store_id = request.args.get('store_id', type=int)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if store_id:
        # SQL query to retrieve total sales grouped by SalesType for the specified StoreID
        query = """
        SELECT
            CASE 
                WHEN Discount > 0 THEN 'Discounted'
                ELSE 'Regular'
            END as SalesType, 
            SUM(TotalPrice) as TotalSales
        FROM
            orders
        WHERE
            storeid = %s
        GROUP BY
            SalesType
        ORDER BY
            SalesType;
        """
        params = (store_id,)
    else:
        # SQL query to retrieve total sales grouped by SalesType for all store IDs between 5000 and 5500
        query = """
        SELECT
            CASE 
                WHEN Discount > 0 THEN 'Discounted'
                ELSE 'Regular'
            END as SalesType, 
            SUM(TotalPrice) as TotalSales
        FROM
            orders
        WHERE
            storeid BETWEEN 5000 AND 5500
        GROUP BY
            SalesType
        ORDER BY
            SalesType;
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)

# RAJESH -- CODE END

#ASWITHA -- ORDER STATUS DISTRIBUTION -- SALES
@app.route('/api/sales-manager/order-status-distribution', methods=['GET'])
def order_status_distribution_sales():
    store_id = request.args.get('store_id', type=int)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if store_id:
        query = """
            SELECT orderstatus, COUNT(orderid) AS OrderCount
            FROM orders
            WHERE storeid = %s
            GROUP BY orderstatus;
            """
        params = (store_id,)
    else:
        query = """
            SELECT orderstatus, COUNT(orderid) AS OrderCount
            FROM orders
            GROUP BY orderstatus;
            """
        params = ()
    
    try:
        cur.execute(query, (store_id,))
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
# ASWITHA -- CODE END

##-- FINANCIAL UI PART --##
## chart  : HIMANSHU -- CUSTOMER FEEDBACK DATA -- financial analyst
@app.route('/api/financial-analyst/customer-feedback', methods=['GET'])
def customer_feedback_financial():
    store_id = request.args.get('store_id', type=int)
    
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if store_id:
    # SQL query to retrieve feedback count grouped by feedback score for the specified store ID
        query = """
        SELECT
            customerfeedback,
            COUNT(*) AS FeedbackCount
        FROM
            orders
        WHERE
            storeid = %s
        GROUP BY
            customerfeedback
        ORDER BY
            customerfeedback;
        """
        params = (store_id,)
    else:
        query = """
        SELECT 
            customerfeedback,
            COUNT(*) AS FeedbackCount
        FROM 
            orders
        GROUP BY 
            customerfeedback
        ORDER BY
            customerfeedback;
         """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
## END OF HIMANSHU'

## CHART 2 : Divya -- order status distribution -- FINANCIAL ANALYST
@app.route('/api/financial-analyst/order-status-distribution', methods=['GET'])
def order_status_distribution_financial():
    store_id = request.args.get('store_id', type=int)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if store_id:

        # SQL query to sum profits grouped by orderdate for the specified store ID
        query = """
        SELECT
            orderstatus,
            Count(orderid) AS OrderCount
        FROM
            orders
        WHERE
            storeid = %s
        GROUP BY
            orderstatus;
        """
        params = (store_id,)
    else:
        # SQL query to  grouped by  for all store IDs
        query = """
        SELECT
            orderstatus,
            Count(orderid) AS orderCount
        FROM
            orders
        GROUP BY
            orderstatus;
        """
        params = ()
    
    
    try:
        cur.execute(query, (store_id,))
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
## divya -- end

## chart 3 : dinakar -- order volume over time -- financial analyst
@app.route('/api/financial-analyst/order-volume-over-time', methods=['GET'])
def order_volume_over_time_financial():
    store_id = request.args.get('store_id', type=int)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if store_id:
        # SQL query to count orders grouped by orderdate for the specified store ID
        query = """
        SELECT
            orderdate,
            COUNT(orderid) AS OrderCount
        FROM
            orders
        WHERE
            storeid = %s
        GROUP BY
            orderdate
        ORDER BY
            orderdate;
        """
        params = (store_id,)
    else:
        # SQL query to count orders grouped by orderdate for store IDs 5000 to 5038
        query = """
        SELECT
            orderdate,
            COUNT(orderid) AS OrderCount
        FROM
            orders
        WHERE
            storeid BETWEEN 5000 AND 5038
        GROUP BY
            orderdate
        ORDER BY
            orderdate;
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
## dinakar -- end

#pujitha -- profit by orderdate -- financial analyst
@app.route('/api/financial-analyst/profit-by-orderdate', methods=['GET'])
def profit_by_orderdate_financial():
    store_id = request.args.get('store_id', type=int)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if store_id:
        # SQL query for specified store_id
        query = """
        SELECT
            orderdate,
            SUM(profit) AS TotalProfit
        FROM
            orders
        WHERE
            storeid = %s
        GROUP BY
            orderdate, storeid
        ORDER BY
            orderdate, storeid;
        """
        params = (store_id,)
    else:
        # SQL query for all store_ids in the range 5000 to 5500
        query = """
        SELECT
            orderdate,
            SUM(profit) AS TotalProfit
        FROM
            orders
        WHERE
            storeid BETWEEN 5000 AND 5500
        GROUP BY
            orderdate
        ORDER BY
            orderdate;
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
## pujitha -- end

## chart 5 : pradeep -- revenue over time -- financial analyst
@app.route('/api/financial-analyst/revenue-over-time', methods=['GET'])
def revenue_over_time_financial():
    storeid = request.args.get('storeid', type=int)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if storeid:
        query = """
        SELECT
            orderdate,
            SUM(totalprice) AS TotalRevenue
        FROM
            orders
        WHERE
            storeid=%s
        GROUP BY
            orderdate, storeid
        ORDERS BY
            orderdate;
        """
        params = (storeid,)
    else:
        query = """
        SELECT
            orderdate,
            SUM(totalprice) AS TotalRevenue
        FROM
            orders
        GROUP BY
            orderdate
        ORDER BY
            orderdate;
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
## pradeep end

## chart 6 : Avilash -- total-sales-map-overview
@app.route('/api/financial-analyst/total-sales-map-overview', methods=['GET'])
def total_sales_map_overview_financial():
    store_id = request.args.get('store_id', type=int)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if store_id:
        query="""
            SELECT 
                s.storelocation,
                SUM(o.totalprice) AS TotalSales
            FROM 
                orders o
            JOIN 
                stores s ON o.storeid = s.storeid
            WHERE 
                o.storeid = %s
            GROUP BY 
                s.storelocation;
        """
        params = (store_id,)

    else:
        query = """
            SELECT
                s.storelocation,
                SUM(o.totalprice) AS TotalSales
            FROM
                orders o
            JOIN 
                stores s ON o.storeid = s.storeid
            GROUP BY
                s.storelocation;
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
## avilash end

## chart 7 : profit distribution -- sirisha -- financial analyst
@app.route('/api/financial-analyst/profit-distribution', methods=['GET'])
def profit_distribution_financial():
    store_id = request.args.get('store_id', type=int)
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # SQL query to retrieve feedback count grouped by feedback score for the specified store ID
    if store_id:
        query = """
            SELECT
            p.category,
            SUM(o.profit) AS total_profit
            FROM
                orders o
            JOIN
                products p ON o.productid = p.productid
            WHERE 
                storeid = %s
            GROUP BY p.category
        """
        params = (store_id,)
    else:
        query = """
            SELECT
            p.category,
            SUM(o.profit) AS total_profit
            FROM
                orders o
            JOIN
                products p ON o.productid = p.productid
            WHERE 
                storeid = %s
            GROUP BY p.category
        """
        params = ()
    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
## sirisha code end

## chart 8 : mrudula -- profit over time -- financial analyst
@app.route('/api/financial-analyst/profit-over-time', methods =['GET'])
def profit_over_time_financial():
    store_id = request.args.get('store_id', type = int)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory = RealDictCursor)

    if store_id:
        # SQL query to sum profits grouped by orderdate for the specified store ID
        query = """
        SELECT
            orderdate,
            SUM(profit) AS TotalProfit
        FROM
            orders
        WHERE
            storeid = %s
        GROUP BY
            orderdate, storeid
        ORDER BY
            orderdate, storeid;
        """
        params = (store_id,)
    else:
        # SQL query to sum profits grouped by orderdate for all store IDs
        query = """
        SELECT
            orderdate,
            SUM(profit) AS TotalProfit
        FROM
            orders
        GROUP BY
            orderdate
        ORDER BY
            orderdate;
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
## mrudula end

## chart 9 : mounika -- revenue vs profit -- financial analyst
@app.route('/api/financial-analyst/revenue-vs-profit-by-category', methods=['GET'])
def revenue_vs_profit_by_category_financial():
    store_id = request.args.get('store_id', type=int)
    
    conn = get_db_connection()
    cur = conn.cursor()

    if store_id:
        # SQL query to retrieve revenue and profit grouped by category for the specified store ID
        query = """
        SELECT p.Category, 
               SUM(o.TotalPrice) AS TotalRevenue, 
               SUM(o.Profit) AS TotalProfit
        FROM Orders o
        JOIN Products p ON o.Productid = p.Productid
        WHERE o.StoreID = %s
        GROUP BY p.Category
        ORDER BY p.Category;
        """
        params = (store_id,)
    else:
        # SQL query to retrieve revenue and profit grouped by category for all store IDs
        query = """
        SELECT p.Category, 
               SUM(o.TotalPrice) AS TotalRevenue, 
               SUM(o.Profit) AS TotalProfit
        FROM Orders o
        JOIN Products p ON o.Productid = p.Productid
        GROUP BY p.Category
        ORDER BY p.Category;
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
## mounika end



## Prathiksha-- profit by product category and sucategory data -- sales
@app.route('/api/product-info/<int:product_id>', methods=['GET'])
def get_product_info(product_id):
    store_id = request.args.get('store_id', type=int)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if store_id:
            query = """
                SELECT
                    p.productid,
                    p.productname,
                    p.category,
                    p.subcategory,
                    o.unitprice,
                    o.quantity,
                    o.profit
                FROM
                    products p
                JOIN
                    orders o ON p.productid = o.productid
                WHERE
                    p.productid = %s AND o.storeid = %s
                LIMIT 1;
            """
            params = (product_id, store_id)
        else:
            query = """
                SELECT
                    p.productid,
                    p.productname,
                    p.category,
                    p.subcategory,
                    o.unitprice,
                    o.quantity,
                    o.profit
                FROM
                    products p
                JOIN
                    orders o ON p.productid = o.productid
                WHERE
                    p.productid = %s
                LIMIT 1;
            """
            params = (product_id,)

        cur.execute(query, params)
        result = cur.fetchone()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify(result)
##prathiksha code end here

@app.route('/api/top-products', methods=['GET'])
def get_top_products():
    store_id = request.args.get('store_id', type=int)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if store_id:
            query = """
                SELECT DISTINCT ON (p.category)
                    p.productname,
                    p.category,
                    o.totalprice
                FROM
                    products p
                JOIN 
                    orders o ON p.productid = o.productid
                WHERE
                    o.storeid = %s
                ORDER BY
                    p.category, o.totalprice DESC;
            """
            params = (store_id,)
        else:
            query = """
                SELECT DISTINCT ON (p.category)
                    p.productname,
                    p.category,
                    o.totalprice
                FROM
                    products p
                JOIN 
                    orders o ON p.productid = o.productid
                ORDER BY
                    p.category, o.totalprice DESC;
            """
            params = ()

        cur.execute(query, params)
        result = cur.fetchall()

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()


@app.route('/api/financial-analyst/profit-by-category', methods=['GET'])
def get_profit_by_category():
    store_id = request.args.get('store_id', type=int)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if store_id:
        query = """
            SELECT
                p.category,
                SUM(o.profit) AS total_profit
            FROM
                products p
            JOIN
                orders o ON p.productid = o.productid
            WHERE
                o.storeid = %s
            GROUP BY
                p.category
            ORDER BY
                total_profit DESC;
        """
        params = (store_id,)
    else:
        query = """
            SELECT
                p.category,
                SUM(o.profit) AS total_profit
            FROM
                products p
            JOIN
                orders o ON p.productid = o.productid
            GROUP BY
                p.category
            ORDER BY
                total_profit DESC;
        """
        params = ()

    try:
        cur.execute(query, params)
        result = cur.fetchall()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify(result)

@app.route('/api/financial-analyst/profit-by-product', methods=['GET'])
def get_profit_by_product():
    store_id = request.args.get('store_id', type=int)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if store_id:
            query = """
                SELECT
                    p.productname,
                    SUM(o.profit) AS total_profit
                FROM
                    products p
                JOIN
                    orders o ON p.productid = o.productid
                WHERE
                    o.storeid = %s
                GROUP BY
                    p.productname
                ORDER BY
                    total_profit DESC;
            """
            params = (store_id,)
        else:
            query = """
                SELECT
                    p.productname,
                    SUM(o.profit) AS total_profit
                FROM
                    products p
                JOIN
                    orders o ON p.productid = o.productid
                GROUP BY
                    p.productname
                ORDER BY
                    total_profit DESC;
            """
            params = ()

        cur.execute(query, params)
        result = cur.fetchall()

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
        
@app.route('/api/order-info/<int:order_id>', methods=['GET'])
def get_order_info(order_id):
    store_id = request.args.get('store_id', type=int)

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if store_id:
        query = """
            SELECT
                o.orderid,
                o.orderdate,
                o.orderstatus,
                o.deliverydate,
                o.shippingcost,
                o.quantity,
                o.totalprice
            FROM
                orders o
            WHERE
                o.orderid = %s AND o.storeid = %s
            LIMIT 1;
        """
        params = (order_id, store_id)
    else:
        query = """
            SELECT
                o.orderid,
                o.orderdate,
                o.orderstatus,
                o.deliverydate,
                o.shippingcost,
                o.quantity,
                o.totalprice
            FROM
                orders o
            WHERE
                o.orderid = %s
            LIMIT 1;
        """
        params = (order_id,)

    try:
        cur.execute(query, params)
        result = cur.fetchone()
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify(result)



##Pranita Data Metrics Financial Analyst


@app.route('/api/financial-analyst/data-metrics', methods=['GET'])
def get_metrics():
    store_id = request.args.get('store_id', type=int)
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # Fetch KPI data
        kpi_query = """
        SELECT
            SUM(totalprice) AS total_sales,
            SUM(profit) AS total_profit,
            COUNT(orderid) AS total_orders,
            SUM(shippingcost) AS total_shipping,
            (SUM(totalprice) - SUM(costofgoodssold)) / SUM(totalprice) * 100 AS gross_margin
        FROM
            orders
        {0};
        """.format("WHERE storeid = %s" if store_id else "")
        cur.execute(kpi_query, (store_id,) if store_id else ())
        kpi_data = cur.fetchone()

        # Fetch Profit Over Time data (grouped by 6-month intervals)
        profit_over_time_query = """
        SELECT
            DATE_TRUNC('month', orderdate) AS month,
            SUM(profit) AS total_profit
        FROM
            orders
        {0}
        GROUP BY
            month
        ORDER BY
            month;
        """.format("WHERE storeid = %s" if store_id else "")
        cur.execute(profit_over_time_query, (store_id,) if store_id else ())
        profit_over_time_data = cur.fetchall()

        # Fetch Revenue Over Time data (grouped by 6-month intervals)
        revenue_over_time_query = """
        SELECT
            DATE_TRUNC('month', orderdate) AS month,
            SUM(totalprice) AS total_revenue
        FROM
            orders
        {0}
        GROUP BY
            month
        ORDER BY
            month;
        """.format("WHERE storeid = %s" if store_id else "")
        cur.execute(revenue_over_time_query, (store_id,) if store_id else ())
        revenue_over_time_data = cur.fetchall()

       # Fetch Sales by Region data
        sales_by_region_query = """
        SELECT
            TRIM(SPLIT_PART(s.storelocation, ',', 3)) AS country,
            SUM(o.totalprice) AS total_sales
        FROM
            orders o
        JOIN
            stores s ON o.storeid = s.storeid
        {0}
        GROUP BY
            country;
        """.format("WHERE o.storeid = %s" if store_id else "")
        cur.execute(sales_by_region_query, (store_id,) if store_id else ())
        sales_by_region_data = cur.fetchall()




        # Fetch Profit Distribution by Category data
        profit_distribution_query = """
        SELECT
            p.category,
            SUM(o.profit) AS total_profit
        FROM
            orders o
        JOIN
            products p ON o.productid = p.productid
        {0}
        GROUP BY
            p.category;
        """.format("WHERE o.storeid = %s" if store_id else "")
        cur.execute(profit_distribution_query, (store_id,) if store_id else ())
        profit_distribution_data = cur.fetchall()

        # Fetch Revenue vs Profit by Category data
        revenue_vs_profit_query = """
        SELECT
            p.category,
            SUM(o.totalprice) AS total_revenue,
            SUM(o.profit) AS total_profit
        FROM
            orders o
        JOIN
            products p ON o.productid = p.productid
        {0}
        GROUP BY
            p.category;
        """.format("WHERE o.storeid = %s" if store_id else "")
        cur.execute(revenue_vs_profit_query, (store_id,) if store_id else ())
        revenue_vs_profit_data = cur.fetchall()

        result = {
            "kpi": kpi_data,
            "profit_over_time": profit_over_time_data,
            "revenue_over_time": revenue_over_time_data,
            "sales_by_region": sales_by_region_data,
            "profit_distribution": profit_distribution_data,
            "revenue_vs_profit": revenue_vs_profit_data,
        }
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cur.close()
        conn.close()
    
    return jsonify(result)
##Pranita Data Metrics Financial Analyst End

##code for the report page -- avilash 14-07-24
# Database connection settings
DB_NAME = "your_db_name"
DB_USER = "DataVistaInterns"
DB_PASSWORD = "Interns@2024"
DB_HOST = "datavistapostgresql.postgres.database.azure.com"
DB_PORT = "5432"  # Default PostgreSQL port

@app.route('/api/sales-data', methods=['GET'])
def get_sales_data():
    # Get filter parameters from the request
    filters = request.args.to_dict()

    # Connect to the database
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT)
    cur = conn.cursor()

    # Construct the SQL query based on the filters
    # For example:
    query = "SELECT * FROM sales_data WHERE order_date BETWEEN %s AND %s"
    params = (filters['start_date'], filters['end_date'])

    # Execute the query
    cur.execute(query, params)
    rows = cur.fetchall()

    # Close the database connection
    cur.close()
    conn.close()

    # Return the data as JSON
    return jsonify(rows)
##code for the report page -- end
## Header for Sales manager [code in apps/templates/includes/navigation-sales.html ] done by Ankit [modified by Avilash n Pranita]
## Header for Financial Analyst [code in apps/templates/includes/navigation.html] done by Pavan | modified by Pranita and Avilash

@app.route('/test', methods=['GET'])
def test_route():
    return jsonify({'message': 'Test route is working'})    

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

if DEBUG:
    app.logger.info('DEBUG       = ' + str(DEBUG)             )
    app.logger.info('DBMS        = ' + app_config.SQLALCHEMY_DATABASE_URI)
    app.logger.info('ASSETS_ROOT = ' + app_config.ASSETS_ROOT )
    app.logger.info("Flask app is running and endpoints should be accessible.")

if __name__ == "__main__":
    logger.debug(f"Database URI: {current_app.config['SQLALCHEMY_DATABASE_URI']}")
    logger.debug("Initializing database...")
    db.create_all()
    logger.debug("Database initialized.")
    app.run(debug=True)
