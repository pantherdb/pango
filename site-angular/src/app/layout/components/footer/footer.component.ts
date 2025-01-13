import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'pango-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class PangoFooterComponent implements OnInit {
  currentYear = new Date().getFullYear()

  constructor() {

  }

  ngOnInit() {
  }

}
