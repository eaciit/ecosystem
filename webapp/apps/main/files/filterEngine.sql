
		SELECT 
		TB.*
		FROM
		(
			SELECT 
			cust_long_name,
			COUNT(DISTINCT cpty_sci_leid) AS supplier_count
			FROM 
			(
				
		SELECT
		cust_group_name, 
		cust_long_name, 
		cust_coi,
		cust_sci_leid,
		cpty_group_name,
		cpty_long_name,
		cpty_coi,
		cpty_sci_leid,
		COUNT(1) AS transaction_number,
		SUM(amount * rate) AS total_amount
		FROM
		vw_sc_model_for_tblau_20170830
		WHERE 
		customer_role IN ('BUYER', 'DRAWEE')
		AND product_code IN ('VPrP', 'TPM')
		AND SUBSTRING(cpty_credit_grade, 1, CHAR_LENGTH(cpty_credit_grade)-1) <= 9
		 AND transaction_year = 2017
		
		GROUP BY 
		cust_group_name, 
		cust_long_name, 
		cust_coi,
		cust_sci_leid,
		cpty_group_name,
		cpty_long_name,
		cpty_coi,
		cpty_sci_leid
		HAVING
		transaction_number >= 12
	
			) TA1
			GROUP BY
			cust_long_name
			HAVING
			supplier_count >= 20
		) TA
		LEFT JOIN
		(
			
		SELECT
		cust_group_name, 
		cust_long_name, 
		cust_coi,
		cust_sci_leid,
		cpty_group_name,
		cpty_long_name,
		cpty_coi,
		cpty_sci_leid,
		COUNT(1) AS transaction_number,
		SUM(amount * rate) AS total_amount
		FROM
		vw_sc_model_for_tblau_20170830
		WHERE 
		customer_role IN ('BUYER', 'DRAWEE')
		AND product_code IN ('VPrP', 'TPM')
		AND SUBSTRING(cpty_credit_grade, 1, CHAR_LENGTH(cpty_credit_grade)-1) <= 9
		 AND transaction_year = 2017
		
		GROUP BY 
		cust_group_name, 
		cust_long_name, 
		cust_coi,
		cust_sci_leid,
		cpty_group_name,
		cpty_long_name,
		cpty_coi,
		cpty_sci_leid
		HAVING
		transaction_number >= 12
	
		) TB
		ON TA.cust_long_name = TB.cust_long_name
	