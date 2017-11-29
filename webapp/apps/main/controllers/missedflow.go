package controllers

import (
	"reflect"
	"strconv"
	"strings"

	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/sqlh"
	tk "github.com/eaciit/toolkit"
)

type MissedFlowPayload struct {
	GroupName        string
	EntityName       string
	CounterpartyName string
	Role             string
	Limit            int
	Group            string
	FlowAbove        int
	DateType         string // Either MONTH or YEAR
	YearMonth        int
}

func (p *MissedFlowPayload) Escape() {
	valuePointer := reflect.ValueOf(p)
	value := valuePointer.Elem()

	for i := 0; i < value.NumField(); i++ {
		field := value.Field(i)

		if field.Type() != reflect.TypeOf("") {
			continue
		}

		str := field.Interface().(string)
		str = strings.Replace(str, "'", "''", -1)
		field.SetString(str)
	}
}

type MissedFlowController struct {
	*BaseController
}

func (c *MissedFlowController) Index(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	return c.SetViewData(nil)
}

func (c *MissedFlowController) GetTopEntities(key string, payload *MissedFlowPayload) ([]string, error) {

	sql := `SELECT ` + key + `, SUM(amount * rate) AS total
  FROM ` + c.tableName() + `
  WHERE ` + c.commonWhereClause()

	// Filters for Entity Name
	if strings.ToUpper(payload.EntityName) != "ALL" {
		sql += " AND cust_long_name = '" + payload.EntityName + "'"
	} else {
		sql += " AND cust_group_name = '" + payload.GroupName + "'"
	}

	// Filters for YearMonth
	if payload.YearMonth > 0 {
		if strings.ToUpper(payload.DateType) == "MONTH" {
			sql += " AND transaction_month = " + strconv.Itoa(payload.YearMonth)
		} else {
			sql += " AND transaction_year = " + strconv.Itoa(payload.YearMonth)
		}
	}

	// Filters for Role
	if strings.ToUpper(payload.Role) == "BUYER" {
		sql += " AND " + c.customerRoleClause() + " = 'BUYER'"
	} else if strings.ToUpper(payload.Role) == "PAYEE" {
		sql += " AND " + c.customerRoleClause() + " = 'PAYEE'"
	} else {
		sql += " AND " + c.customerRoleClause() + " IN ('BUYER', 'PAYEE')"
	}

	// Filters for NTB/ETB
	if strings.ToUpper(payload.Group) == "NTB" {
		sql += " AND " + c.isNTBClause() + " = 'Y'"
	} else if strings.ToUpper(payload.Group) == "ETB" {
		sql += " AND " + c.isNTBClause() + " = 'N'"
	} else if strings.ToUpper(payload.Group) == "INTRA-GROUP" {
		sql += " AND cust_group_name = cpty_group_name"
	}

	sql += " GROUP BY " + key

	// Filters for Flows
	if payload.FlowAbove > 0 {
		sql += " HAVING total > " + strconv.Itoa(payload.FlowAbove)
	}

	sql += " ORDER BY total DESC"

	if payload.Limit > 0 {
		sql += " LIMIT " + strconv.Itoa(payload.Limit)
	}

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		return []string{}, err
	}

	returnData := []string{}
	for _, v := range results {
		returnData = append(returnData, v.GetString(key))
	}

	return returnData, nil
}

func (c *MissedFlowController) GetMissedFlowData(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := MissedFlowPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	payload.Escape()

	entityKey := "cust_long_name"
	if strings.ToUpper(payload.EntityName) != "ALL" {
		entityKey = "cpty_long_name"
	}

	entities, err := c.GetTopEntities(entityKey, &payload)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	entitiesEscaped := []string{}
	for _, v := range entities {
		entitiesEscaped = append(entitiesEscaped, "'"+v+"'")
	}

	entitiesClause := "(" + strings.Join(entitiesEscaped, ", ") + ")"

	sql := `SELECT cpty_long_name, cpty_coi, cpty_group_name, cust_long_name, cust_coi, cust_group_name, 
  LEFT(counterparty_bank, 4) AS cpty_bank, 
	LEFT(customer_bank, 4) AS cust_bank, 
	` + c.customerRoleClause() + ` AS cust_role,
	` + c.isNTBClause() + ` AS is_ntb,
  SUM(amount * rate) AS total
  FROM ` + c.tableName() + `
	WHERE ` + c.commonWhereClause()

	// Filters for Entity Name
	if strings.ToUpper(payload.EntityName) != "ALL" {
		sql += ` AND cust_long_name = '` + payload.EntityName + `' 
		AND cpty_long_name IN ` + entitiesClause
	} else {
		sql += ` AND cust_group_name = '` + payload.GroupName + `'
		AND cust_long_name IN ` + entitiesClause
	}

	// Filters for YearMonth
	if payload.YearMonth > 0 {
		if strings.ToUpper(payload.DateType) == "MONTH" {
			sql += " AND transaction_month = " + strconv.Itoa(payload.YearMonth)
		} else {
			sql += " AND transaction_year = " + strconv.Itoa(payload.YearMonth)
		}
	}

	// Filters for Role
	if strings.ToUpper(payload.Role) == "BUYER" {
		sql += " AND " + c.customerRoleClause() + " = 'BUYER'"
	} else if strings.ToUpper(payload.Role) == "PAYEE" {
		sql += " AND " + c.customerRoleClause() + " = 'PAYEE'"
	} else {
		sql += " AND " + c.customerRoleClause() + " IN ('BUYER', 'PAYEE')"
	}

	// Filters for NTB/ETB
	if strings.ToUpper(payload.Group) == "NTB" {
		sql += " AND " + c.isNTBClause() + " = 'Y'"
	} else if strings.ToUpper(payload.Group) == "ETB" {
		sql += " AND " + c.isNTBClause() + " = 'N'"
	} else if strings.ToUpper(payload.Group) == "INTRA-GROUP" {
		sql += " AND cust_group_name = cpty_group_name"
	}

	sql += " GROUP BY cpty_coi, cpty_long_name, cpty_group_name, cust_coi, cust_long_name, cust_group_name, cpty_bank, cust_bank, cust_role, is_ntb "

	// Filters for Flows
	if payload.FlowAbove > 0 {
		sql += " HAVING total > " + strconv.Itoa(payload.FlowAbove)
	}

	sql += " ORDER BY total DESC"

	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err = qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results)
}
