import ResponseObj from "../../../classes/ResponseObj";
import fetch from 'node-fetch';
import apiProps from "../../../../secrets";
import * as Types from '../../../types/types';


const connectionProps = apiProps('confluence') as Types.IConfluenceConnectionProps;

/**
 * Метод для создания новой страницы в Confluence
 * @param parrentId ID страницы, которая будет родительской для новой
 * @param pageTitle Название новой страницы
 * @param bodyContent HTML-контент новой страницы
 * @returns 
 */
export default function createPage(parrentId: number, pageTitle: string, bodyContent: string):Promise<Types.IDataResp> {
    return new Promise ((resolve, reject) => {
        const page = {
            "type": "page",
            "title": pageTitle,
            "space": {
                "key": "MCC"
            },
            "ancestors": [
                {
                    "id": parrentId
                }
            ],
            "body": {
                "storage": {
                    "value": bodyContent,
                    "representation": "storage"
                }
            }
        }

        const requestOptions = {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${connectionProps.bearerToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(page)
        };
        
        fetch(`https://${connectionProps.origin}/${connectionProps.path}`, requestOptions)
            .then(res => res.json())
            .then(
                (result) => {
                    // console.log(result);
                    if(result.status === 'current') {
                        resolve(new ResponseObj(true, 200, null, null, null))
                    } else {
                        reject(new ResponseObj(false, 500, null, result, `Не удалось создать страницу ${pageTitle}`))
                    }
                },
                (error) => {
                    reject(new ResponseObj(false, 500, null, error, `Не удалось создать страницу ${pageTitle}`))
                }
            ).catch(err => 
                reject(new ResponseObj(false, 500, null, err, `Не удалось создать страницу ${pageTitle}`)));
    })
}