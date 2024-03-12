const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const credentialsJsonPath = path.resolve(
	__dirname,
	"..",
	"assets",
	"ga4_analytics_viewer_secrets.json"
);
require("dotenv").config();

// load the Google service account login details
var loadServiceAccountInfo = () => {
	return new Promise((resolve, reject) => {
		fs.readFile(
			credentialsJsonPath,
			"utf8",
			(error, serviceAccountInfoData) => {
				if (error) {
					console.log("loadServiceAccountInfo failed: " + error);
					reject(error);
				} else {
					var serviceAccountInfo = JSON.parse(serviceAccountInfoData);
					resolve(serviceAccountInfo);
				}
			}
		);
	});
};

//return a an authenticated Google API client
var getJwtClient = (serviceAccountInfo) => {
	return new Promise((resolve, reject) => {
		var jwtClient = new google.auth.JWT(
			serviceAccountInfo.client_email,
			null,
			serviceAccountInfo.private_key,
			["https://www.googleapis.com/auth/analytics.readonly"],
			null
		);
		jwtClient.authorize((error, tokens) => {
			if (error) {
				console.log("getJwtClient failed: " + error);
				reject(error);
			} else {
				resolve(jwtClient);
			}
		});
	});
};

// 원하는 데이터를 회신해 주는 함수
var getAnalyticsData = ({ client, analytics, viewID, options }) => {
	return new Promise((resolve, reject) => {
		analytics.data.ga.get(
			{
				auth: client,
				ids: viewID,
				...options
			},
			function (error, response) {
				if (error) {
					console.log("getAnalyticsData failed: " + error);
					reject(error);
				} else {
					resolve(response);
				}
			}
		);
	});
};


// 회신된 데이터에서 columnHeader만 Array로 회신해주는 함수
const getOnlyColumnHeaders = (headers)=>{
    return headers.map(header=>{
        return header.name
    })
}

/*
    // For Debug:: getOnlyColumnHeaders 
    // 테스트용 헤더 코드 제공
    const onlyHeaders = getOnlyColumnHeaders([{
        "name": "ga:date",
        "columnType": "DIMENSION",
        "dataType": "STRING"
    }, {
        "name": "ga:landingPagePath",
        "columnType": "DIMENSION",
        "dataType": "STRING"
    }, {
        "name": "ga:country",
        "columnType": "DIMENSION",
        "dataType": "STRING"
    }, {
        "name": "ga:users",
        "columnType": "METRIC",
        "dataType": "INTEGER"
    }, {
        "name": "ga:pageviews",
        "columnType": "METRIC",
        "dataType": "INTEGER"
    }])
    console.info(onlyHeaders)
*/ 



module.exports = {
	loadServiceAccountInfo,
	getJwtClient,
	getAnalyticsData,
    getOnlyColumnHeaders,
};
