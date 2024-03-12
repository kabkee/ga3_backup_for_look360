const { google } = require("googleapis");
const { insertRows } = require("./plugins/mongoDb.js");

/*
    1번의 Query로 최대 1000개 Row가 회신 되기 때문에 전체 데이터가 1000개를 초과하는 경우
    여러 번 회신을 보내야하는데 그 시작 index를 의미함.
    
    예)
    5번째 Query를 보내는 경우, 5001 Row가 첫번째 데이터가 되므로,
    Query 발송 시 "start-index" 값을 5001로 보내야 함.
*/ 
let startIndex = 1;
/*
    1000개 초과의 데이터가 있을 경우, 모든 데이터를 회신 받기 위해서
    전체 데이터를 1000개로 나눈 회수만큼 요청을 해야함.
    다행히도, 현재 Query이외에 다른 쿼리가 남아있을 경우
    nextLink 를 확인하여 추가 요청할 데이터여부를 확인 할 수 있다.
*/
let hasNextLink = false;

// Google Universal Analytics(GA3)의 SDK 관련 사항을 모듈로 분리
const {
	loadServiceAccountInfo,
	getJwtClient,
	getAnalyticsData,
	getOnlyColumnHeaders,
} = require("./plugins/gaHelper.js");

// 실제 조건문을 형성하여 Query를 발송하는 함수
var fetchData = ({ dimensions, metrics, startDate, endDate }) => {
	return new Promise((resolve, reject) => {
		loadServiceAccountInfo()
			.then((serviceAccountInfo) => {
				return getJwtClient(serviceAccountInfo);
			})
			.then((jwtClient) => {
				var client = jwtClient;
				var analytics = google.analytics("v3");
				return getAnalyticsData({
					client,
					analytics,
					viewID: process.env.GOOGLE_ANALYTICS_VIEWID,
					options: {
						"start-index": startIndex,
						"start-date": startDate,
						"end-date": endDate,
						dimensions,
						metrics,
					},
				});
			})
			.then((result) => {
				startIndex += result.data.rows.length;
				hasNextLink = !!result.data.nextLink;
				return resolve(result);
			})
			.catch((error) => {
				console.log("go promise chain failed", error);
				return reject(`"go promise chain failed", ${error}`);
			});
	});
};

// Query 결과 데이터를 담는 변수
let results = [];
// Query 시도 회수
let tryCount = 1;
/*
    해당 Dimensions, Metrics의 Query결과 총 개수
    이 값을 1000개씩 나뉘어 start-index 값을 기준으로 불러올 수 있다.
*/
let totalResult;
/*
    해당 Dimensions, Metrics의 Query결과 총 개수를 1000으로 나눈 페이지 개수
*/
let totalPage;


// Async 형으로 모든 데이터를 수집하기 위해서 nextLink 여부에 따라 다 회수의 Query를 요청하는 함수
const fetchStart = async (options) => {
    let columnHeaderOnly;

	do {

        // 현황을 확인하기 위한 log
        let logStatement = `** trying ${tryCount}`
		if (totalPage) {
			logStatement += `of ${totalPage}`;
        }
        logStatement += `queries.`;
		if (totalResult) {
			logStatement += ` / ${totalResult}`;
        }
        logStatement += ` **`;
        console.info(logStatement);
        
        // Query 결과문 원 데이터 담기
		result = await fetchData(options);

        // Query 처음 요청 시, 비어있는 전체 데이터 수를 저장
		if (!totalResult) {
			totalResult = result.data.totalResults;
            console.info(`this Query Total results is "${totalResult}"`)
		}
        // Query 처음 요청 시, 비어있는 페이지 수를 저장
		if (!totalPage) {
			totalPage =
				Math.floor(
					result.data.totalResults / result.data.itemsPerPage
				) + 1;
		}

		results = [...results, ...result.data.rows];
        columnHeaderOnly = getOnlyColumnHeaders(result.data.columnHeaders)

        console.info(`** Start inserting... "${options.collectionName}" **`);
        await insertRows({
            result: {
                data: [...result.data.rows]
            },
            collectionName: options.collectionName,
            columnHeaders: columnHeaderOnly
        });
        console.info(`** Done inserting... "${options.collectionName}", startIndex: **`, startIndex);
    

        // Query 요청 회수 업데이트 (+1)
		tryCount += 1;
	} while (hasNextLink);

    // Query 전체를 확인하기 위한 log
	// console.info({
	// 	tryCount: results.length,
	// 	data: results,
	// 	columnHeaders: columnHeaderOnly,
	// });

	return {
		tryCount: results.length,
		data: results,
		columnHeaders: getOnlyColumnHeaders(result.data.columnHeaders),
	};
};


// 다른 조건의 여러 개의 Query를 생성할 수 있도록 만든 Async 함수
const fetches = async () => {
	// 국가별 사용자 & 페이지뷰
    // let collectionName = "PAGEVIEWS_BY_COUNTRY";
	// console.info(`** Start fetching... "${collectionName}" **`);
	// const countryResult = await fetchStart({
    //     collectionName,
	// 	dimensions: process.env.QUERY_DEFAULT_DIMENSIONS + ",ga:country",
	// 	metrics: process.env.QUERY_DEFAULT_METRICS,
	// 	startDate: process.env.QUERY_DEFAULT_START_DATE,
	// 	endDate: process.env.QUERY_DEFAULT_END_DATE,
	// });


    // 기기 종류별 사용자 & 페이지뷰
    // let collectionName = "PAGEVIEWS_BY_DEVICE_CATEGORY";
	// console.info(`** Start fetching... "${collectionName}" **`);
	// const countryResult = await fetchStart({
    //     collectionName,
	// 	dimensions: process.env.QUERY_DEFAULT_DIMENSIONS + ",ga:deviceCategory",
	// 	metrics: process.env.QUERY_DEFAULT_METRICS,
	// 	startDate: process.env.QUERY_DEFAULT_START_DATE,
	// 	endDate: process.env.QUERY_DEFAULT_END_DATE,
	// });
    
    
    
    // 채널 그룹별 사용자 & 페이지뷰
    let collectionName = "PAGEVIEWS_BY_CHANNEL_GROUPING";
	console.info(`** Start fetching... "${collectionName}" **`);
	const countryResult = await fetchStart({
        collectionName,
		dimensions: process.env.QUERY_DEFAULT_DIMENSIONS + ",ga:channelGrouping",
		metrics: process.env.QUERY_DEFAULT_METRICS,
		startDate: process.env.QUERY_DEFAULT_START_DATE,
		endDate: process.env.QUERY_DEFAULT_END_DATE,
	});


    return 'Query Done.'
};
fetches();
