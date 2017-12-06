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
	BookingCountries []string
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

func (c *MissedFlowController) GetMissedFlowSQL(payload *MissedFlowPayload) string {
	sql := `SELECT cpty_long_name, cpty_coi, cpty_group_name, cust_long_name, cust_coi, cust_group_name, 
  LEFT(counterparty_bank, 4) AS cpty_bank, 
	LEFT(customer_bank, 4) AS cust_bank, 
	` + c.customerRoleClause() + ` AS cust_role,
	` + c.isNTBClause() + ` AS is_ntb,
  SUM(amount * rate) AS total
  FROM ` + c.tableName() + `
	WHERE ` + c.commonWhereClause()

	// Filters for Booking Country
	if len(payload.BookingCountries) > 0 {
		quotedBookingCountries := []string{}
		for _, v := range payload.BookingCountries {
			quotedBookingCountries = append(quotedBookingCountries, "'"+v+"'")
		}

		sql += " AND booking_country IN (" + strings.Join(quotedBookingCountries, ",") + ")"
	}

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

	if payload.Limit > 0 {
		sql += " LIMIT " + strconv.Itoa(payload.Limit)
	}

	return sql
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

	if strings.ToUpper(payload.Group) == "ALL" {
		payload.Group = "NTB"
		sql := c.GetMissedFlowSQL(&payload)
		qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
		if qr.Error() != nil {
			c.SetResultError(qr.Error().Error(), nil)
		}

		results1 := []tk.M{}
		err = qr.Fetch(&results1, 0)
		if err != nil {
			c.SetResultError(err.Error(), nil)
		}

		payload.Group = "ETB"
		sql = c.GetMissedFlowSQL(&payload)
		qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
		if qr.Error() != nil {
			c.SetResultError(qr.Error().Error(), nil)
		}

		results2 := []tk.M{}
		err = qr.Fetch(&results2, 0)
		if err != nil {
			c.SetResultError(err.Error(), nil)
		}

		payload.Group = "INTRA-GROUP"
		sql = c.GetMissedFlowSQL(&payload)
		qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
		if qr.Error() != nil {
			c.SetResultError(qr.Error().Error(), nil)
		}

		results3 := []tk.M{}
		err = qr.Fetch(&results3, 0)
		if err != nil {
			c.SetResultError(err.Error(), nil)
		}

		results := append(results1, results2...)
		results = append(results, results3...)

		return c.SetResultOK(results)
	}

	sql := c.GetMissedFlowSQL(&payload)
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
