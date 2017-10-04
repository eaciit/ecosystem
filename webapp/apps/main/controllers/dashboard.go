package controllers

import (
	"github.com/eaciit/knot/knot.v1"
	"github.com/eaciit/sqlh"
	tk "github.com/eaciit/toolkit"
)

type DashboardPayload struct {
	fromYearMonth int
	toYearMonth   int
}

type DashboardController struct {
	*BaseController
}

func (c *DashboardController) Index(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	return c.SetViewData(nil)
}

func (c *DashboardController) GetETB(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	sql := "SELECT COUNT(*) AS value FROM table1"
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results[0].Get("value"))
}

func (c *DashboardController) GetBuyer(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	sql := "SELECT COUNT(*) AS value FROM table1"
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results[0].Get("value"))
}

func (c *DashboardController) GetSeller(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	sql := "SELECT COUNT(*) AS value FROM table1"
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results[0].Get("value"))
}

func (c *DashboardController) GetInFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	sql := "SELECT COUNT(*) AS value FROM table1"
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results[0].Get("value"))
}

func (c *DashboardController) GetOutFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	sql := "SELECT COUNT(*) AS value FROM table1"
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	results := []tk.M{}
	err := qr.Fetch(&results, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(results[0].Get("value"))
}

func (c *DashboardController) GetYearChangeBuyer(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := "SELECT COUNT(*) AS value FROM eco_test"
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = "SELECT COUNT(*) AS value FROM table1"
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result2 := []tk.M{}
	err = qr.Fetch(&result2, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	diff := result1[0].GetFloat64("value") - result2[0].GetFloat64("value")

	return c.SetResultOK(diff)
}

func (c *DashboardController) GetYearChangeSeller(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := "SELECT COUNT(*) AS value FROM eco_test"
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = "SELECT COUNT(*) AS value FROM table1"
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result2 := []tk.M{}
	err = qr.Fetch(&result2, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	diff := result1[0].GetFloat64("value") - result2[0].GetFloat64("value")

	return c.SetResultOK(diff)
}

func (c *DashboardController) GetYearChangeInFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := "SELECT COUNT(*) AS value FROM eco_test"
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = "SELECT COUNT(*) AS value FROM table1"
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result2 := []tk.M{}
	err = qr.Fetch(&result2, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	diff := result1[0].GetFloat64("value") - result2[0].GetFloat64("value")

	return c.SetResultOK(diff)
}

func (c *DashboardController) GetYearChangeOutFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := "SELECT COUNT(*) AS value FROM eco_test"
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = "SELECT COUNT(*) AS value FROM table1"
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result2 := []tk.M{}
	err = qr.Fetch(&result2, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	diff := result1[0].GetFloat64("value") - result2[0].GetFloat64("value")

	return c.SetResultOK(diff)
}

func (c *DashboardController) GetYearChangeETB(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := "SELECT COUNT(*) AS value FROM eco_test"
	qr := sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result1 := []tk.M{}
	err = qr.Fetch(&result1, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	sql = "SELECT COUNT(*) AS value FROM table1"
	qr = sqlh.Exec(c.Db, sqlh.ExecQuery, sql)
	if qr.Error() != nil {
		c.SetResultError(qr.Error().Error(), nil)
	}

	result2 := []tk.M{}
	err = qr.Fetch(&result2, 0)
	if err != nil {
		c.SetResultError(err.Error(), nil)
	}

	diff := result1[0].GetFloat64("value") - result2[0].GetFloat64("value")

	return c.SetResultOK(diff)
}

func (c *DashboardController) GetChartETB(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := "SELECT Growth AS value FROM eco_test LIMIT 10"
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

func (c *DashboardController) GetChartBuyer(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := "SELECT Growth AS value FROM eco_test LIMIT 10"
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

func (c *DashboardController) GetChartSeller(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := "SELECT Growth AS value FROM eco_test LIMIT 10"
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

func (c *DashboardController) GetChartInFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := "SELECT Growth AS value FROM eco_test LIMIT 10"
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

func (c *DashboardController) GetChartOutFlow(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	payload := DashboardPayload{}
	err := k.GetPayload(&payload)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	sql := "SELECT Growth AS value FROM eco_test LIMIT 10"
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
