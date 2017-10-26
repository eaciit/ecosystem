package controllers

import (
	"github.com/eaciit/knot/knot.v1"
)

type RecommendEngineController struct {
	*BaseController
}

func (c *RecommendEngineController) Index(k *knot.WebContext) interface{} {
	c.SetResponseTypeHTML(k)
	if !c.ValidateAccessOfRequestedURL(k) {
		return nil
	}

	return c.SetViewData(nil)
}
