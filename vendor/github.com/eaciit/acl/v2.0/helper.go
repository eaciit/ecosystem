package acl

import (
	"github.com/eaciit/toolkit"
)

var listvalue = []int{1, 2, 4, 8, 16, 32, 64, 128}
var listgrantvalue = []AccessTypeEnum{1, 2, 4, 8, 16, 32, 64, 128}

var mapaccessenum = map[string]AccessTypeEnum{"create": 1, "read": 2, "update": 4,
	"delete": 8, "special1": 16, "special2": 32, "special3": 64, "special4": 128}

func splitgrantvalue(in AccessTypeEnum) []int {
	ain := make([]int, 0, 0)
	for _, i := range listvalue {
		if Matchaccess(i, int(in)) {
			ain = append(ain, i)
		}
	}
	return ain
}

func Splitinttogrant(in int) []AccessTypeEnum {
	ain := make([]AccessTypeEnum, 0, 0)
	for _, i := range listgrantvalue {
		if Matchaccess(int(i), in) {
			ain = append(ain, i)
		}
	}
	return ain
}

func GetAccessEnum(key string) AccessTypeEnum {
	v, k := mapaccessenum[key]
	if k {
		return v
	}
	return 0
}

func Matchaccess(searchAccess int, sourceAccess int) bool {
	if searchAccess == (searchAccess & sourceAccess) {
		return true
	}
	return false
}

func getgrantindex(ag []AccessGrant, AccessID string) (found bool, in int) {
	found = false
	for i, v := range ag {
		if v.AccessID == AccessID {
			in = i
			found = true
			break
		}
	}

	return
}

func (acli *ACLInstance) getlastpassword(UserId string) (passwd string) {
	passwd = ""

	tUser := new(User)
	err := acli.FindByID(tUser, UserId)
	if err != nil {
		return
	}

	passwd = tUser.Password

	return
}

func sortarrayaccess(sarrtkm []toolkit.M) (arrtkm []toolkit.M) {
	arrtkm = make([]toolkit.M, 0, 0)
	var icurr int

	for i, val := range sarrtkm {
		icurr = 0
		index := val.GetInt("index")

		for _, valx := range arrtkm {
			icurr++
			indexx := valx.GetInt("index")
			if index < indexx {
				icurr--
				break
			}
		}

		if i == 0 || icurr == len(arrtkm) {
			arrtkm = append(arrtkm, val)
		} else {

			tarrtkm := make([]toolkit.M, 0, 0)
			for ix := 0; ix < icurr; ix++ {
				tarrtkm = append(tarrtkm, arrtkm[ix])
			}

			tarrtkm = append(tarrtkm, val)

			for ix := icurr; ix < len(arrtkm); ix++ {
				tarrtkm = append(tarrtkm, arrtkm[ix])
			}

			arrtkm = make([]toolkit.M, 0, 0)
			arrtkm = append([]toolkit.M{}, tarrtkm...)
		}

	}

	return
}

func insertchild(key string, sub interface{}, parrent []toolkit.M) (ltkm []toolkit.M, found bool) {
	found = false
	ltkm = make([]toolkit.M, len(parrent), len(parrent))
	for i, val := range parrent {
		if key == val.GetString("_id") {
			found = true
			val.Set("submenu", sub)
		}

		submenu := val["submenu"].([]toolkit.M)
		if !found && len(submenu) > 0 {
			submenu, found = insertchild(key, sub, submenu)
		}

		ltkm[i] = val
	}

	return
}
