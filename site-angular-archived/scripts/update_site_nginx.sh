#!/bin/bash

set -e

date_suffix=$(date +'%m-%d-%y')
rm -rf "/var/www/pango/old/site-$date_suffix"
mv /var/www/pango/site "/var/www/pango/old/site-$date_suffix"
mv /home/ubuntu/projects/pango/site-angular/dist/ /var/www/pango/site
