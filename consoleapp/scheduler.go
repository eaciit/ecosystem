package consoleapp

import (
	"fmt"
	"io/ioutil"

	"github.com/jasonlvhit/gocron"

	"github.com/eaciit/sqlh"
)

type Scheduler struct {
	FilePath    string
	GcScheduler *gocron.Scheduler
}

func (sc *Scheduler) readSQLFromFile() (string, error) {
	b, err := ioutil.ReadFile(sc.FilePath)
	if err != nil {
		return "", err
	}

	return string(b), nil
}

func (sc *Scheduler) generate() error {
	fmt.Println("-----> RECOMENDED ENGINE SCHEDULER: Initializing")

	text, err := sc.readSQLFromFile()
	if err != nil {
		return err
	}

	db, err := sqlh.Connect("mysql", "root:@tcp(localhost:3306)/eaciit_test")
	if err != nil {
		return err
	}

	temp1TableName := "re_ecosys_temp_1"
	temp2TableName := "re_ecosys_temp_2"
	readyTableName := "re_ecosys_ready"

	// Drop existing temporary table
	fmt.Println("-----> RECOMENDED ENGINE SCHEDULER: Drop existing table")

	sql := "DROP TABLE IF EXISTS " + temp1TableName
	qr := sqlh.Exec(db, sqlh.ExecNonScalar, sql)
	if qr.Error() != nil {
		return qr.Error()
	}
	defer qr.Close()

	// Generate data on temporary table
	fmt.Println("-----> RECOMENDED ENGINE SCHEDULER: Generating data on temporary table")

	sql = "CREATE TABLE " + temp1TableName + " AS " + text
	qr = sqlh.Exec(db, sqlh.ExecNonScalar, sql)
	if qr.Error() != nil {
		return qr.Error()
	}

	fmt.Println("-----> RECOMENDED ENGINE SCHEDULER: DONE! Generating data on temporary table")

	// Rename ready table to temp_2
	fmt.Println("-----> RECOMENDED ENGINE SCHEDULER: Rename ready table to temp_2 table")

	sql = "RENAME TABLE " + readyTableName + " TO " + temp2TableName
	qr = sqlh.Exec(db, sqlh.ExecNonScalar, sql)
	if qr.Error() != nil {
		return qr.Error()
	}

	// Rename ready table to temp_2
	fmt.Println("-----> RECOMENDED ENGINE SCHEDULER: Rename temp_1 table to ready table")

	sql = "RENAME TABLE " + temp1TableName + " TO " + readyTableName
	qr = sqlh.Exec(db, sqlh.ExecNonScalar, sql)
	if qr.Error() != nil {
		return qr.Error()
	}

	// Rename temp_2 to temp_1
	fmt.Println("-----> RECOMENDED ENGINE SCHEDULER: Rename temp_2 table to temp_1 table")

	sql = "RENAME TABLE " + temp2TableName + " TO " + temp1TableName
	qr = sqlh.Exec(db, sqlh.ExecNonScalar, sql)
	if qr.Error() != nil {
		return qr.Error()
	}

	fmt.Println("-----> RECOMENDED ENGINE SCHEDULER: DONE!")

	return nil
}

func (sc *Scheduler) run() {
	err := sc.generate()
	if err != nil {
		fmt.Println(err.Error())
	}
}

func ScheduleRun(filePath string) *Scheduler {
	fmt.Println("-----> RECOMENDED ENGINE SCHEDULER: Starting Scheduler")

	sc := &Scheduler{}
	sc.FilePath = filePath

	s := gocron.NewScheduler()
	s.Every(1).Day().At("23:00").Do(sc.run)

	// For testing only
	// s.Every(10).Seconds().Do(sc.run)

	go func() {
		<-s.Start()
	}()

	_, time := s.NextRun()
	fmt.Println("-----> RECOMENDED ENGINE SCHEDULER: Next Run at", time)

	sc.GcScheduler = s

	return sc
}
