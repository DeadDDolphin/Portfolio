import apiProps from '../../../../secrets';
import ResponseObj from '../../../classes/ResponseObj';
import * as Types from '../../../types/types';
import http from 'http';


const connectionProps = apiProps('products-api') as Types.IConnectionProps;

/**
 * Функция для отправки запросов к products-api по адресу /confluenceApi
 * @param requestBody тело запроса, отправляемое products-api 
 * @returns Промис с объектом ответа @type {Promise<ResponseObj<{}>>}
 */
export default function confluenceApiRequest(requestBody: Types.IProductsApiRequestBody): Promise<ResponseObj<{}>> {
    return new Promise (async(resolve, reject) => {
        //отключаем проверку сертификатов
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = '0';
        
        const httpOptions = {
            hostname: connectionProps.origin,
            path: "/confluenceApi",
            port: connectionProps.port,
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            }

        }
        const request = http.request(httpOptions, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data = data + chunk.toString();
            });

            response.on('end', () => {
                const result = JSON.parse(data);
                
                if(result.success) {                        
                    resolve(result);
                } else {
                    reject(result);
                }
            });
        });

        request.on('error', (error) => reject(
            new ResponseObj(false, 500, null, error, "confluenceApiRequest - ошибка при подключении к products-api")
        ));

        request.write(JSON.stringify(requestBody));

        request.end();
    })
}