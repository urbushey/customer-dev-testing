Known Bugs

- The Normalize Email UDF doesn't seem to be working when it should be stripping out periods in gmail addresses...

```
select narrative_poc.code.normalize_email('Nick.jordan@gmail.com') = nick.jordan@gmail.com and should be nickjordan@gmail.com
```

- Inner SELF JOINs not working.  See overlap reports for how we have to use an OUTER JOIN to make it work.

