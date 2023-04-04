import ResponseObj from "../../../classes/ResponseObj";
import fetch from 'node-fetch';
import apiProps from "../../../../secrets";
import * as Types from '../../../types/types';


const connectionProps = apiProps('confluence') as Types.IConfluenceConnectionProps;

/**
 * Метод для удаления страниц в Confluence
 * @param pageId ID удаляемой страницы
 * @returns 
 */
export default function deletePage(pageId: string): Promise<Types.IDataResp> {
    return new Promise((resolve, reject) => {
        try {
            
            process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = '0';
            
            const requestOptions = {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${connectionProps.bearerToken}`,
                    "Content-type": "application/json"
                },
            };
            const url = `https://${connectionProps.origin}/${connectionProps.path}/${pageId}`;

            fetch(url, requestOptions)
                .then(res => {
                    resolve(new ResponseObj(true, 200, null ,null ,null));
                })
                .catch(err => {
                    reject(new ResponseObj(false, 500, null, err, `Не удалось удалить страницу ${pageId}`))
                })
            
        } catch (error) {                
            reject(new ResponseObj(false, 500, null, error as {}, `Ошибка при удалении страницы с id = ${pageId}`))
        }
    })
}