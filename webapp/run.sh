sudo pkill scb-eco
echo '' > nohup.out
go build -o scb-eco
nohup ./scb-eco &
tail -f nohup.out
