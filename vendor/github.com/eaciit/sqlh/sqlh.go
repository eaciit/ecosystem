package sqlh

import (
	"database/sql"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/eaciit/toolkit"
)

type ExecTypeEnum int

const (
	ExecQuery ExecTypeEnum = 0
	//ExecQuerySingle              = 1
	ExecNonScalar = 2
)

var (
	GlobalDateFormat = "2006-01-02 15:04:05"
)

type QueryResult struct {
	DateFormat string
	rows       *sql.Rows
	err        error

	buffers   []interface{}
	bufferPtr []interface{}

	columnnames []string
	columntypes []*sql.ColumnType
	result      sql.Result
}

func (q *QueryResult) Error() error {
	return q.err
}

func (q *QueryResult) Close() {
	if q.rows != nil {
		q.rows.Close()
	}
}

func (q *QueryResult) CUDAResult() sql.Result {
	return q.result
}

func (q *QueryResult) Fetch(objs interface{}, n int) error {
	var err error
	inloop := true
	read := 0

	ms := []toolkit.M{}

	dataTypeList := toolkit.M{}
	//valueType := reflect.TypeOf(objs).Elem()
	elem, _ := toolkit.GetEmptySliceElement(objs)
	valueType := reflect.TypeOf(elem)
	isStruct := false
	//fmt.Println(valueType.Kind())
	if valueType.Kind() == reflect.Struct {
		for i := 0; i < valueType.NumField(); i++ {
			namaField := strings.ToLower(valueType.Field(i).Name)
			dataType := valueType.Field(i).Type.String()
			dataTypeList.Set(namaField, dataType)
		}
		isStruct = true
	}

	for inloop {
		if q.rows.Next() {
			if err = q.rows.Scan(q.bufferPtr...); err != nil {
				return err
			}

			m := toolkit.M{}
			for i, name := range q.columnnames {
				var v interface{}

				if q.buffers[i] != nil {
					bs := q.buffers[i].([]byte)
					v = string(bs)
				} else {
					v = nil
				}

				if isStruct {
					for fieldname, datatype := range dataTypeList {
						if strings.ToLower(name) == fieldname {
							switch datatype.(string) {
							case "time.Time":
								v, _ = time.Parse(q.DateFormat, v.(string))
							case "int", "int32", "int64":
								val, e := strconv.Atoi(toolkit.ToString(v))
								if e != nil {
									v = toolkit.ToString(v)
								} else {
									v = val
								}
							case "float", "float32", "float64":
								val, e := strconv.ParseFloat(toolkit.ToString(v), 64)
								if e != nil {
									v = toolkit.ToString(v)
								} else {
									v = val
								}
							case "bool":
								v = (v == "1" || v == "true")
							default:
								v = toolkit.ToString(v)
							}

						}
					}
				} else {
					if v != nil {
						intVal, e := strconv.Atoi(toolkit.ToString(v))
						if e != nil {
							e = nil
							floatVal, e := strconv.ParseFloat(toolkit.ToString(v), 64)
							if e != nil {
								e = nil
								boolVal, e := strconv.ParseBool(toolkit.ToString(v))
								if e != nil {
									e = nil
									dateval, e := time.Parse(q.DateFormat, v.(string))
									if e == nil {
										v = dateval /*if string is date*/
									}
								} else { /*if string is bool*/
									v = boolVal
								}
							} else { /*if string is float*/
								v = floatVal
							}
						} else { /*if string is int*/
							v = intVal
						}
					}
				}
				m.Set(name, v)
			}
			ms = append(ms, m)

			read++
			if n > 0 {
				if read > n {
					inloop = false
				}
			}
		} else {
			inloop = false
		}
	}

	if read > 0 {
		err = toolkit.Serde(ms, objs, "")
		if err != nil {
			return err
		}
	}
	return nil
}

func Connect(driver, connection string) (*sql.DB, error) {
	return sql.Open(driver, connection)
}

func Exec(db *sql.DB, execType ExecTypeEnum, sql string, args ...interface{}) *QueryResult {
	q := &QueryResult{}

	switch execType {
	case ExecQuery:
		rows, err := db.Query(sql, args...)
		if err != nil {
			q.err = err
			return q
		}

		columns, err := rows.Columns()
		if err != nil {
			q.err = err
			return q
		}
		columntypes, err := rows.ColumnTypes()
		if err != nil {
			q.err = err
			return q
		}

		q.columnnames = columns
		q.columntypes = columntypes
		count := len(columns)
		q.buffers = make([]interface{}, count)
		q.bufferPtr = make([]interface{}, count)
		for i, _ := range columns {
			q.bufferPtr[i] = &q.buffers[i]
		}

		q.rows = rows
		q.DateFormat = GlobalDateFormat
	case ExecNonScalar:
		result, err := db.Exec(sql, args...)
		if err != nil {
			q.err = err
			return q
		}

		q.result = result
	}

	return q
}
