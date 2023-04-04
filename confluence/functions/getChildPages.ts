import apiProps from "../../../../secrets";
import ResponseObj from "../../../classes/ResponseObj";
import * as Types from '../../../types/types'
import fetch from 'node-fetch';

const connectionProps = apiProps('confluence') as Types.IConfluenceConnectionProps;

export default async function getChildPages(pageId: string | number, limit?: number, start?: number): Promise<ResponseObj<Types.IConfluenceChildPageData[]>> {
    return new Promise((resolve, reject) => {
        //отключаем проверку сертификатов
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = '0';

        const requestOptions = {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${connectionProps.bearerToken}`
            }
        };
        //limit - ограничение на количество получаемых дочерних элементов. Дефолт=25
        const url = `https://${connectionProps.origin}/${connectionProps.path}/${pageId}/child/page?${limit ? `limit=${limit}` : ''}${start ? `&start=${start}` : ''}`;

        fetch(url, requestOptions)
            .then(res => res.json())
            .then(
                (result) => {
                    if (result.statusCode && result.statusCode === 404) {
                        reject(new ResponseObj(false, 500, null, result,
                            `getChildPages - страница с id = ${pageId} не найдена`));
                    } else {
                        if (result.results.length > 0) {
                            const processedData:Types.IConfluenceChildPageData[] = result.results.map((item: any) => {
                                return {
                                    pageId: item.id,
                                    pageTitle: item.title
                                }
                            });
                            resolve(new ResponseObj(true, 200, processedData, null, null));
                        } else {
                            resolve(new ResponseObj(true, 200, [], null, null));
                        }
                    }
                },
                (error) => {
                    reject(new ResponseObj(false, 500, null, error, 
                        `getChildPages - не удалось выполнить запрос при получении страницы с id = ${pageId}`));
                })
            .catch((error) => {
                reject(new ResponseObj(false, 500, null, error, 
                    `getChildPages - не удалось подключиться к Confluence(id = ${pageId}`));
            })
    })
}