package controllers

import (
	"github.com/eaciit/knot/knot.v1"
)

type CounterPartyMainController struct {
	*BaseController
}

func (c *CounterPartyMainController) Index(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	return c.SetViewData(nil)
}
