import apiProps from "../../../../secrets";
import ResponseObj from "../../../classes/ResponseObj";
import * as Types from '../../../types/types'
import confluenceApiRequest from "./confluenceApiRequest";
import getChildPages from "./getChildPages";
import pg from 'pg';
import createSolProductId from "../../../functions/createSolProductId";
import productPageContent from "./productPageContent";
import getItemLink from "../../../functions/getItemLink";
import updatePage from "./updatePage";

const connectionProps = apiProps('confluence') as Types.IConfluenceConnectionProps;
/**
 * Функция для переименовывания всех страниц конфлюэнс в ветке "Продукты интегрированные в МСС"
 * @param limit - ограничение на количество получаемых страниц для перименования
 * @returns Промис с объектом, где данные - строка об успешности выполнения
 */
export default function renameAllPages(secondLvlPagesWithoutChilds:  ISecondLvlPage[]): Promise<ResponseObj<string>> {
    /**
     * Корневая - 1 уровень
        Дочерние корневой - 2 уровень
        Дочерние дочерних - 3 уровень

        1. Получить все дочерние страницы корневой (метод получения дочерних - есть)
        2. Для каждой дочерней страницы 2 уровня получить все дочерние страницы 
        3. Для каждой страницы 2 и 3 уровней получить контент, название, версию.
        4. для страниц уровня 2 по названию найти совпадения в базе. 
            Получить mcc_product_id, sol_id, ppi_id, product_name
            Можно использовать getProductForActions + getMccProducts, смапить по product_id
            sol_id и ppi_id можно получить, профильтровав д

            Хотя проще написать новый метод.
        5. Для страниц уровня 3 изменить название
        6. Для страниц уровня 2 изменить название и контент

        Важно: реализовать всё так, чтобы не сломался инструмент верификации
        После переименования необходимо по названиям сохранить URL в базу.
        После этого работа с МК происходит исключительно по ID
     */

    const getProductsDataByTitles = (pageTitle: string): Promise<ResponseObj<IProdData[]>> => {
        const connectionProductsProps = apiProps('pgLocal', 'products') as Types.IPgLocalProps;

        const client = new pg.Client(connectionProductsProps);

        return new Promise((resolve, reject) => {
            client.connect(async err => {
                if (err) {
                    reject(new ResponseObj(false, 500, null, err, 'getProductsDataByTitles - Ошибка подключения к dbLocal, products'));
                    console.log(err);
                }
                else {

                    try {
                        // const productsResponse:ResponseObj<{rowCount: number, rows: Types.IProdIdObject[]}> = await new Promise ((resolve, reject) => {
                        const query =
                            `
                            SELECT * FROM
                            (

                                SELECT DISTINCT
                                    t2.ppi_id as ppi_id,
                                    t1.bp_sol_id as sol_id,
                                    t1.bp_sol_code as sol_code,
                                    t2.ppi_name as product_name,
                                    'ppi' as data_type
                                FROM public.sol_business_products t1
                                LEFT JOIN public.ppi_products t2
                                ON t1.bp_ppi_id = t2.ppi_id
                                WHERE 1=1
                                    AND t1.bp_ppi_id IS NOT NULL 
                                    AND t1.bp_ppi_id != 'Отсутствует' 
                                    AND t2.ppi_id IS NOT NULL

                                UNION ALL

                                SELECT DISTINCT
                                    null as ppi_id,
                                    t1.bp_sol_id as sol_id,
                                    t1.bp_sol_code as sol_code,
                                    t1.bp_name as product_name,
                                    'bp' as data_type
                                FROM public.sol_business_products t1
                                LEFT JOIN public.ppi_products t2
                                ON t1.bp_ppi_id = t2.ppi_id
                                WHERE 1=1
                                    AND (bp_ppi_id IS NULL OR (t1.bp_ppi_id IS NOT NULL AND (t1.bp_ppi_id = 'Отсутствует' OR t2.ppi_id IS NULL)))

                                UNION ALL

                                SELECT DISTINCT
                                    ppi_id as ppi_id,
                                    0 as sol_id,
                                    null as sol_code,
                                    t1.ppi_name as product_name,
                                    'ppi' as data_type
                                FROM public.ppi_products t1
                                LEFT JOIN public.sol_business_products t2
                                ON t1.ppi_id = t2.bp_ppi_id
                                WHERE 1=1
                                    AND t2.bp_internal_id IS NULL

                                UNION ALL
                                SELECT DISTINCT 
                                    null as ppi_id,
                                    t1.itp_sol_id as sol_id,
                                    t1.itp_sol_code as sol_code,
                                    t1.itp_name as product_name,
                                    'itp' as data_type
                                FROM public.sol_it_products t1
                                LEFT JOIN
                                (SELECT bp_sol_code, bp_ppi_id, bp_consuming_software 
                                FROM public.sol_business_products
                                WHERE bp_consuming_software_count > 0) t2
                                ON t1.itp_sol_object_id::varchar(20) = ANY(string_to_array(t2.bp_consuming_software, ','))
                                WHERE 1=1
                                    AND t1.itp_type not in ('Service', 'ITService', 'TechnicalRecord')
                                    --AND (t2.bp_consuming_software IS NULL or (t1.itp_type in ('Platform')))

                            ) result 
                            WHERE 1=1 
                            and (
                                sol_code in ('${pageTitle}')
                                or 
                                ppi_id in ('${pageTitle}')
                                or 
                                'bp_' || sol_id in ('${pageTitle}')
                                or 
                                'itp_' || sol_id in ('${pageTitle}')
                                or 
                                'bp_' || ppi_id in ('${pageTitle}')
                            )`;

                        client.query(query)
                            .then(res => {
                                resolve(
                                    new ResponseObj(true, 200, res.rows, null, null)
                                )
                            }).catch(err =>
                                reject(new ResponseObj(false, 500, null, err,
                                    "getProductsDataByTitles - Не удалось получить продукты из products-api")))
                            .finally(() => client.end());
                        // });
                        // resolve(new ResponseObj(true, 200, {rowCount: processedData.length, rows: processedData}, null ,null));
                    } catch (error) {
                        reject(error);
                    }


                }
            });
        })
    }

    return new Promise(async (resolve, reject) => {
        try {
            //Всего страниц 165, лимит на всякий 200
            // const secondLvlPagesResp = await getChildPages(connectionProps.rootPageId, limit, start);

            // const secondLvlPagesWithoutChilds: ISecondLvlPage[] = secondLvlPagesResp.data;
            console.log('secondLvlPages', secondLvlPagesWithoutChilds);
            const secondLvlPages: ISecondLvlPage[] = [];
            const errors = [];
            // Получили дочерние 3-го уровня
            for (let page of secondLvlPagesWithoutChilds) {
                const childPagesPromise = await new Promise(async (resolve) => {
                    try {                        
                        const childPagesResp = await getChildPages(page.pageId);
                        page.childPages = childPagesResp.data;
                        resolve(new ResponseObj(true, 200 ,null ,null ,null));
                    } catch (error) {
                        resolve(new ResponseObj(false, 500, null, error as {}, `Не удалось получить дочерние страницы ${page.pageId}, ${page.pageTitle}`))

                    }
                }) as Types.IDataResp

                if(childPagesPromise.success){
                    secondLvlPages.push(page);
                } else {
                    errors.push(childPagesPromise);
                }
            }
            

            //Насытили страницы второго уровня доп. данными
            for (let secPage of secondLvlPages) {
                const saturateDataPromise = await new Promise(async(resolve) => {
                    try {                                
                        const secPageData = await confluenceApiRequest({
                            methodType: "getPageDataById",
                            data: {
                                pageId: secPage.pageId
                            }
                        });

                        secPage.version = (secPageData.data as Types.IConfluPageData).pageVersion;
                        secPage.pageContent = (secPageData.data as Types.IConfluPageData).bodyContent;
                        secPage.pageTitle = (secPageData.data as Types.IConfluPageData).pageTitle;
                        resolve(new ResponseObj(true, 200 ,null ,null ,null));

                    } catch (error) {
                        resolve(new ResponseObj(false, 500, null, error as {}, `Не удалось получить данные страницы по ID ${secPage.pageId}, ${secPage.pageTitle}`))
                    }
                }) as Types.IDataResp

                if(!saturateDataPromise.success){
                    errors.push(saturateDataPromise)
                }
            }

            //Насытили страницы 3-го уровня доп. данными
            for (let secPage of secondLvlPages) {
                if (secPage.childPages && secPage.childPages.length > 0) {
                    for (let thirdPage of secPage.childPages) {
                        const saturateDataPromise = await new Promise(async(resolve) => {
                            try {                                
                                const thirdPageData = await confluenceApiRequest({
                                    methodType: "getPageDataById",
                                    data: {
                                        pageId: thirdPage.pageId
                                    }
                                });
        
                                thirdPage.version = (thirdPageData.data as Types.IConfluPageData).pageVersion;
                                thirdPage.pageTitle = (thirdPageData.data as Types.IConfluPageData).pageTitle;
                                thirdPage.pageContent = (thirdPageData.data as Types.IConfluPageData).bodyContent;
                                resolve(new ResponseObj(true, 200 ,null ,null ,null));        
                            } catch (error) {
                                resolve(new ResponseObj(false, 500, null, error as {}, `Не удалось получить данные страницы по ID ${secPage.pageId}, ${secPage.pageTitle}`))
                            }
                        }) as Types.IDataResp
        
                        if(!saturateDataPromise.success){
                            errors.push(saturateDataPromise)
                        }
                        
                    }
                }
            }
            
            const oldCodePages = [];
            //Изменяем данные страниц
            for(let secPage of secondLvlPages) {
                const mappedProductResp = await getProductsDataByTitles(secPage.pageTitle);
                const mappedProduct = mappedProductResp.data && mappedProductResp.data.length > 0 ?
                    mappedProductResp.data[0] : null;

                if(mappedProduct) {
                    const solProductId = createSolProductId(mappedProduct.sol_id, mappedProduct.ppi_id, mappedProduct.data_type);
                    secPage.pageTitle = solProductId;
                    //Если на страние не было контента, то создаем новый
                    secPage.pageContent =  
                        productPageContent(mappedProduct.product_name, 
                            mappedProduct.ppi_id ? getItemLink('ppi', mappedProduct.ppi_id) : null,
                            mappedProduct.sol_id ? 
                                mappedProduct.data_type === 'bp' || mappedProduct.data_type === 'ppi' ? 
                                    getItemLink('bp', mappedProduct.sol_id) : 
                                mappedProduct.data_type === 'itp' ? 
                                    getItemLink('itp', mappedProduct.sol_id) :   
                                null :
                            null);
                    
                    if (secPage.childPages && secPage.childPages.length > 0) {
                        for (let thirdPage of secPage.childPages) {
                            const splitedThirdPage = thirdPage.pageTitle.split('_');
                            const pageType = splitedThirdPage[splitedThirdPage.length - 1];

                            thirdPage.pageTitle = solProductId + '_' + pageType;
                        }
                    } 
                } else {
                    oldCodePages.push(secPage);
                }
            }

            const successResults = [];
            //Меняем страницы в конфлюэнс
            for (let secPage of secondLvlPages) {
                const updatePromise = await new Promise (async resolve => {
                    try {                        
                        const updateSecResult = await updatePage(secPage.pageId, secPage.pageTitle, 
                            secPage.pageContent ? secPage.pageContent : '', secPage.version ? secPage.version + 1 : 0);

                        if (secPage.childPages && secPage.childPages.length > 0) {
                            for (let thirdPage of secPage.childPages) {
                                if(thirdPage.version) {
                                    const updateThirdResult = await updatePage(thirdPage.pageId, thirdPage.pageTitle, 
                                        thirdPage.pageContent ? thirdPage.pageContent : '', thirdPage.version ? thirdPage.version + 1 : 0);    
                                }    
                            }
                        }

                        resolve(new ResponseObj(true, 200 ,null ,null ,null));
                    } catch (error) {
                        resolve(new ResponseObj(false, 500, null, error as {}, `Не удалось обновить страницу ${secPage.pageId}, ${secPage.pageTitle}`))
                    }
                }) as Types.IDataResp;

                if(updatePromise.success){
                    successResults.push(updatePromise);
                } else {
                    errors.push(updatePromise)
                }
            }

            console.log(oldCodePages);
            if(errors.length > 0) {
                reject(new ResponseObj(false, 500, null, {errors: errors}, `Не все страницы успешно обновились, см. error`))
            } else {
                
                console.log(errors.map((item: any) => {
                    return {
                        pageId: item.data.pageId,
                        pageTitle: item.data.pageTitle,
                    }
                }))
                resolve(new ResponseObj(true, 200, 'Все страницы успешно обновлены', null, null))
            }


        } catch (error) {
            reject(new ResponseObj(false, 500, null, error as {}, `Произошла ошибка при переименовании страниц Confluence`))
        }
    })
}

interface ISecondLvlPage {
    pageId: string,
    pageTitle: string,
    version?: number,
    pageContent?: string
    childPages?: IThirdLvlPage[]
}

interface IThirdLvlPage {
    pageId: string,
    pageTitle: string,
    pageContent?: string
    version?: number
}

interface IProdData {
    sol_id: number,
    ppi_id: string,
    product_name: string,
    sol_code: string,
    data_type: string

}