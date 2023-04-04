import apiProps from '../../../../secrets';
import ResponseObj from '../../../classes/ResponseObj';
import * as Types from '../../../types/types';
import fetch from 'node-fetch';

const connectionProps = apiProps('confluence') as Types.IConfluenceConnectionProps;

export default function updatePage(id:number | string, newTitle: string, bodyContent: string, version: number): Promise<Types.IDataResp> {
    return new Promise ((resolve, reject) => {

        const page = {
            "id": id,
            "type": "page",
            "title": newTitle,
            "space": {
                "key": "MCC"
            },
            "body": {
                "storage": {
                    "value": bodyContent,
                    "representation": "storage"
                }
            },
            "version": {
                "number":version
            }
        }
    
        const requestOptions = {
            method: 'PUT',
            headers: {
                "Authorization": `Bearer ${connectionProps.bearerToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(page)
        };

        fetch(`https://${connectionProps.origin}/${connectionProps.path}/${id}`, requestOptions)
            .then(res => res.json())
            .then(
                (result) => {
                    if( result.status === "current") {
                        resolve(new ResponseObj(true, 200, null, null, null))
                    } else {
                        reject(new ResponseObj(false, 500, null, result, `Не удалось обновить данные страницы ${id} - ${newTitle}`))
                    } 
                },
                (error) => {
                    reject(new ResponseObj(false, 500, null, error, `Не удалось обновить данные страницы ${id} - ${newTitle}`))
                }
            ).catch(error =>
                reject(new ResponseObj(false, 500, null, error, `Не удалось обновить данные страницы ${id} - ${newTitle}`))
            );
    })
}