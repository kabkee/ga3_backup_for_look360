사용 방법
-

1. yarn 명령어 실행으로 필요한 dependencies 설치
```
yarn
```
2. "src/assets/ga4_analytics_viewer_secrets_TEMPLATE.json" 파일을 복사하여 "src/assets/ga4_analytics_viewer_secrets.json" 로 복사 (혹은 다운 받은 secret json 파일명 변경)
```
파일명 : ga4_analytics_viewer_secrets.json
```
3. '.env_TEMEPLATE' 파일을 '.env' 파일로 복사
4. .env 파일의 "GOOGLE_ANALYTICS_VIEWID" 값을 자신의 GA viewId 로 변경
```
예) GOOGLE_ANALYTICS_VIEWID=ga:000000000
```
5. .env의 'QUERY_DEFAULT_' 로 시작하는 값을 자신에 맞게 변경
```
QUERY_DEFAULT_DIMENSIONS = 
QUERY_DEFAULT_METRICS = 
QUERY_DEFAULT_START_DATE = 
QUERY_DEFAULT_END_DATE = 
```    
6. yarn start 로 실행
```
yarn start
```


TODO
-
1. index.js 파일의 136줄의 코드의 변수명 'countryResult'의 값을 이용하여 DB 저장

src/index.js (136)
```JS
console.info("countryResult", countryResult);
```