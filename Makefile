data_conversion_tests:
	cd data_conversion && pytest test.py

%/data_conversion_all:
	cd data_conversion && make $*/all