package controllers

import (
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"

	"github.com/eaciit/knot/knot.v1"

	tk "github.com/eaciit/toolkit"
)

type DashboardController struct {
	*BaseController
}

type DashboardParam struct {
	Flag        string
	StartPeriod int
	EndPeriod   int
}

func (c *DashboardController) GetComponentTableName() string {
	return "Component"
}

func (c *DashboardController) GetStockTableName() string {
	return "Stock"
}

func (c *DashboardController) Index(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	return c.SetViewData(nil)
}

func (c *DashboardController) GetCumulativeReturnData(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	param := DashboardParam{}
	err := k.GetPayload(&param)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	whereClause := tk.M{
		"Period": tk.M{
			"$gte": param.StartPeriod,
			"$lte": param.EndPeriod,
		},
	}

	pipe := []tk.M{}

	if param.Flag != "MAX" {
		pipe = append(pipe, tk.M{"$match": whereClause})
	}

	pipe = append(pipe, tk.M{"$sort": tk.M{"Period": 1}})

	tmpData := []tk.M{}
	crs, err := c.Ctx.Connection.NewQuery().Command("pipe", pipe).From(c.GetStockTableName()).Cursor(nil)
	defer crs.Close()
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}
	err = crs.Fetch(&tmpData, 0, false)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	for i := 0; i < len(tmpData); i++ {
		InnovDailyReturn := 0.0
		RussellDailyReturn := 0.0

		if i > 0 {
			InnovDailyReturn = (tmpData[i].GetFloat64("InnovClose") - tmpData[i-1].GetFloat64("InnovClose")) / tmpData[i-1].GetFloat64("InnovClose")
			RussellDailyReturn = (tmpData[i].GetFloat64("RussellClose") - tmpData[i-1].GetFloat64("RussellClose")) / tmpData[i-1].GetFloat64("RussellClose")
		}

		tmpData[i].Set("InnovDailyReturn", InnovDailyReturn)
		tmpData[i].Set("RussellDailyReturn", RussellDailyReturn)
	}

	return c.SetResultOK(tmpData)
}

func (c *DashboardController) GetSectorBreakDownData(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	param := DashboardParam{}
	err := k.GetPayload(&param)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	groupClause := tk.M{
		"_id":   "$" + param.Flag,
		"count": tk.M{"$sum": 1},
	}

	pipe := []tk.M{}
	pipe = append(pipe, tk.M{"$group": groupClause})
	pipe = append(pipe, tk.M{"$sort": tk.M{"count": -1}})

	tmpData := []tk.M{}
	crs, err := c.Ctx.Connection.NewQuery().Command("pipe", pipe).From(c.GetComponentTableName()).Cursor(nil)
	defer crs.Close()
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}
	err = crs.Fetch(&tmpData, 0, false)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	total := 0.0
	for _, v := range tmpData {
		total += v.GetFloat64("count")
	}

	for _, v := range tmpData {
		v.Set("percentage", v.GetFloat64("count")/total)
	}

	return c.SetResultOK(tmpData)
}

func (c *DashboardController) GetCapBreakDownData(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	secondCondition := tk.M{
		"$and": []tk.M{
			tk.M{"$gte": []interface{}{"$MARKET_CAPITALIZATION", 10000000000}},
			tk.M{"$lt": []interface{}{"$MARKET_CAPITALIZATION", 200000000000}},
		},
	}

	thirdCondition := tk.M{
		"$and": []tk.M{
			tk.M{"$gte": []interface{}{"$MARKET_CAPITALIZATION", 2000000000}},
			tk.M{"$lt": []interface{}{"$MARKET_CAPITALIZATION", 10000000000}},
		},
	}

	projectClause := tk.M{
		"Mega":  tk.M{"$cond": []interface{}{tk.M{"$gte": []interface{}{"$MARKET_CAPITALIZATION", 200000000000}}, 1, 0}},
		"Large": tk.M{"$cond": []interface{}{secondCondition, 1, 0}},
		"Mid":   tk.M{"$cond": []interface{}{thirdCondition, 1, 0}},
		"Small": tk.M{"$cond": []interface{}{tk.M{"$lt": []interface{}{"$MARKET_CAPITALIZATION", 2000000000}}, 1, 0}},
	}

	groupClause := tk.M{
		"_id":   1,
		"Mega":  tk.M{"$sum": "$Mega"},
		"Large": tk.M{"$sum": "$Large"},
		"Mid":   tk.M{"$sum": "$Mid"},
		"Small": tk.M{"$sum": "$Small"},
		"total": tk.M{"$sum": 1},
	}

	pipe := []tk.M{}
	pipe = append(pipe, tk.M{"$project": projectClause})
	pipe = append(pipe, tk.M{"$group": groupClause})

	tmpData := []tk.M{}
	crs, err := c.Ctx.Connection.NewQuery().Command("pipe", pipe).From(c.GetComponentTableName()).Cursor(nil)
	defer crs.Close()
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}
	err = crs.Fetch(&tmpData, 0, false)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	returnDatas := []tk.M{}
	categories := []string{"Mega", "Large", "Mid", "Small"}
	for _, v := range categories {
		data := tk.M{}
		data.Set("label", v)
		data.Set("count", tmpData[0].GetFloat64(v))
		data.Set("percentage", tmpData[0].GetFloat64(v)/tmpData[0].GetFloat64("total"))

		returnDatas = append(returnDatas, data)
	}

	return c.SetResultOK(returnDatas)
}

func (c *DashboardController) GetRealTimeCapBreakDownData(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	pipe := []tk.M{}
	pipe = append(pipe, tk.M{"$project": tk.M{"TICKER": 1}})

	tmpData := []tk.M{}
	crs, err := c.Ctx.Connection.NewQuery().Command("pipe", pipe).From(c.GetComponentTableName()).Cursor(nil)
	defer crs.Close()
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}
	err = crs.Fetch(&tmpData, 0, false)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	tickers := []string{}
	for _, comp := range tmpData {
		tickers = append(tickers, comp.GetString("TICKER"))
	}

	// Get realtime ticker market cap from Yahoo API
	resp, err := http.Get("http://download.finance.yahoo.com/d/quotes.csv?s=" + strings.Join(tickers, ",") + "&f=j1")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	marketCaps := strings.Split(string(body), "\n")

	values := []int{0, 0, 0, 0}
	for i := 0; i < len(tickers); i++ {
		marketCap := marketCaps[i]
		tmp := ""
		multiplier := 0.0
		if strings.Contains(marketCap, "B") {
			tmp = strings.Replace(marketCap, "B", "", 1)
			multiplier = 1000000000
		} else if strings.Contains(marketCap, "M") {
			tmp = strings.Replace(marketCap, "M", "", 1)
			multiplier = 1000000
		}

		tmpNumber, err := strconv.ParseFloat(tmp, 64)
		if err != nil {
			return c.SetResultError(err.Error(), nil)
		}

		tmpNumber *= multiplier
		if tmpNumber > 200000000000 {
			values[0] += 1
		} else if tmpNumber > 10000000000 {
			values[1] += 1
		} else if tmpNumber > 2000000000 {
			values[2] += 1
		} else {
			values[3] += 1
		}
	}

	returnDatas := []tk.M{}
	categories := []string{"Mega", "Large", "Mid", "Small"}
	for i := 0; i < len(categories); i++ {
		data := tk.M{}
		data.Set("label", categories[i])
		data.Set("count", float64(values[i]))
		data.Set("percentage", float64(values[i])/float64(len(tickers)))

		returnDatas = append(returnDatas, data)
	}

	return c.SetResultOK(returnDatas)
}

func (c *DashboardController) GetTopConsBreakDownData(k *knot.WebContext) interface{} {
	c.SetResponseTypeAJAX(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	param := DashboardParam{}
	err := k.GetPayload(&param)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	projectClause := tk.M{
		"index":          "$INDEX",
		"component_name": "$COMPONENT_NAME",
		"category":       "$" + param.Flag,
		"weight":         "$WEIGHT",
	}

	pipe := []tk.M{}
	pipe = append(pipe, tk.M{"$sort": tk.M{"WEIGHT": -1}})
	pipe = append(pipe, tk.M{"$limit": 10})
	pipe = append(pipe, tk.M{"$project": projectClause})

	tmpData := []tk.M{}
	crs, err := c.Ctx.Connection.NewQuery().Command("pipe", pipe).From(c.GetComponentTableName()).Cursor(nil)
	defer crs.Close()
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}
	err = crs.Fetch(&tmpData, 0, false)
	if err != nil {
		return c.SetResultError(err.Error(), nil)
	}

	return c.SetResultOK(tmpData)
}
