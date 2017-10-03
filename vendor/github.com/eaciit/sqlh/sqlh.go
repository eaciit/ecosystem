package sqlh

import (
	"database/sql"

	"github.com/eaciit/toolkit"
)

type ExecTypeEnum int

const (
	ExecQuery ExecTypeEnum = 0
	//ExecQuerySingle              = 1
	ExecNonScalar = 2
)

type QueryResult struct {
	rows *sql.Rows
	err  error

	buffers   []interface{}
	bufferPtr []interface{}

	columnnames []string
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

	for inloop {
		if q.rows.Next() {
			if err = q.rows.Scan(q.bufferPtr...); err != nil {
				return err
			}

			m := toolkit.M{}
			for i, name := range q.columnnames {
				m.Set(name, string(q.buffers[i].([]byte)))
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
		q.columnnames = columns
		count := len(columns)
		q.buffers = make([]interface{}, count)
		q.bufferPtr = make([]interface{}, count)
		for i, _ := range columns {
			q.bufferPtr[i] = &q.buffers[i]
		}

		q.rows = rows

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
