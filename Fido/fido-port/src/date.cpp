// Дата в 16-битном формате DOS (день | месяц<<5 | (год-1980)<<9).
// В оригинале при подключённом dos.h структура переименовывалась макросом
// date -> Date (чтобы не конфликтовать с struct date из Borland).

// round() из оригинала переименован в iround(): имя round занято <cmath>.
int iround(float f)
{return int(f+(f>0?.5:-.5));}

word mofs[]={0,
	     31,
	     31+28,
	     31+28+31,
	     31+28+31+30,
	     31+28+31+30+31,
	     31+28+31+30+31+30,
	     31+28+31+30+31+30+31,
	     31+28+31+30+31+30+31+31,
	     31+28+31+30+31+30+31+31+30,
	     31+28+31+30+31+30+31+31+30+31,
	     31+28+31+30+31+30+31+31+30+31+30
//	    ,31+28+31+30+31+30+31+31+30+31+30+31
	    };
struct date {
 word Date;
 word year();
 word year_();
 byte month();
 byte day();
 word setyear(word year);
 word setmonth(word month);
 word setday(byte day);
 word setdate(byte day,word month,word year);
 word days();
 byte weekday();
 byte daysinmonth();
 word operator -= (word d);
 word operator += (word d);
 word operator = (word d);
// date(byte day=0,word month=0,word year=0);
};

/*date::date(byte day,word month,word year)
{setdate(day,month,year);}
*/

word _year(word Date)
{return ((Date & 0xFE00) >> 9)+1980;}

byte _month(word Date)
{return (Date & 0x01E0) >> 5;}

byte _day(word Date)
{return Date & 0x001F;}

word date::year()
{return _year(Date);}

byte date::month()
{return _month(Date);}

byte date::day()
{return _day(Date);}

word date::setyear(word year)
{Date&=~0xFE00;
 return (Date^=(year-1980) << 9);}

word date::year_()
{return (Date & 0xFE00) >> 9;}

word date::setmonth(word month)
{if (month>12) {setyear(_year(Date)+(month-1)/12);month=(month-1)%12+1;} // port: было month%12+1 (13 -> февраль)
 Date&=~0x01E0;
 return Date^= month << 5;}

word date::setday(byte day)
{Date&=~0x001F;
 return Date^=day;}

word date::setdate(byte day,word month,word year)
{setyear(year);setmonth(month);setday(day);return Date;}

word date::days()
{word y=year_(); // port: было (y=year_())*365+(y+3>>2) в одном выражении
return day()+mofs[month()-1]+y*365+(y+3 >> 2) //1980 is leap-year
       +(!(y & 0x0003) && month()>2);
}

word operator - (date a,date b)
{return a.days()-b.days();}

word dstodate(word days)
{word d,j,i,k,y;
 date dt;
 y=days/365.25;
 while ((d=y*365+((y+3)>>2))>=days) y--;
 d=days-d;
 if (!(y & 0x0003))	//for leap-year
  if (d==mofs[2]+1)     //29 Feb
   {dt.setmonth(2);dt.setday(29);goto l1;}
  else if (d>mofs[2]) d--;
 if (d>mofs[11]) k=11;
 else
 {i=0;j=11;
  while (j>i+1)
  {k=(i+j)>>1;
   if (d>mofs[k]) i=k;else j=k;
  }
  k=i;
 }
 dt.setmonth(k+1);
 dt.setday(d-mofs[k]);
 l1:dt.setyear(y+1980);
 return dt.Date;
}

word date::operator -= (word d)
{return Date=dstodate(days()-d);}

word date::operator += (word d)
{return Date=dstodate(days()+d);}

word date::operator = (word d)
{return Date=d;}

word operator - (date a,word d)
{return dstodate(a.days()-d);}

word operator + (date a,word d)
{return dstodate(a.days()+d);}

byte operator < (date a,date b)
{return a.days()<b.days();}
byte operator < (date a,float b)
{date x;
 x.setdate(int(b),iround(int(b*1000) % 1000/10.0),a.year());
 return a<x;}

byte operator > (date a,date b)
{return a.days()>b.days();}
byte operator > (date a,float b)
{date x;
 x.setdate(int(b),iround(int(b*1000) % 1000/10.0),a.year());
 return a>x;}

byte operator <= (date a,date b)
{return a.days()<=b.days();}
byte operator <= (date a,float b)
{date x;
 x.setdate(int(b),iround(int(b*1000) % 1000/10.0),a.year());
 return a<=x;}

byte operator >= (date a,date b)
{return a.days()>=b.days();}
byte operator >= (date a,float b)
{date x;
 x.setdate(int(b),iround(int(b*1000) % 1000/10.0),a.year());
 return a>=x;}

byte operator == (date a,date b)
{return a.Date==b.Date;}
byte operator == (date a,float b)
{return a.day()==int(b) && iround(int(b*1000) % 1000/10.0)==a.month();}

byte operator != (date a,date b)
{return a.Date!=b.Date;}
byte operator != (date a,float b)
{return !(a.day()==int(b) && iround(int(b*1000) % 1000/10.0)==a.month());}

byte date::weekday()
{return (days()+7)%7; //0 - Monday... 6 - Sunday
}

byte date::daysinmonth()
{byte x=month();
 return x==12?31:(mofs[x]-mofs[x-1]);
}

word getcurdate()
{time_t t=time(NULL);
 struct tm *lt=localtime(&t);
 int y=lt->tm_year+1900;
 if (y<1980) y=1980; else if (y>2107) y=2107;
 return (word)(lt->tm_mday | ((lt->tm_mon+1) << 5) | ((y-1980) << 9));
}

typedef date Date;
