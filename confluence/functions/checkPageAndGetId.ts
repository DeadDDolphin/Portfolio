import confluenceApiRequest from "./confluenceApiRequest";
import * as Types from '../../../types/types'
import createPage from "./createPage";
import ResponseObj from "../../../classes/ResponseObj";


export default function checkPageAndGetId(rootId: number, pageTitle: string, bodyContent: string): Promise<ResponseObj<number>> {
    return new Promise(async (resolve, reject) => {
        try {
            //получение страницы продукта
            const pageResult = await confluenceApiRequest({
                methodType: "getPageByTitle",
                data: {
                    pageTitle: pageTitle,
                    space: "MCC"
                }
            });
            
            let parrentId = 0;
            if (pageResult.success && pageResult.data) {
                parrentId = Number((pageResult.data as Types.IConfluPageResp).id);
            }
            //если страницы нет, то ее создание и получение ID
            if (parrentId === 0) {
                await createPage(rootId, pageTitle, bodyContent);
                const resNewPageId = await confluenceApiRequest({
                    methodType: "getPageByTitle",
                    data: {
                        pageTitle: pageTitle,
                        space: "MCC"
                    }
                });;

                if (resNewPageId.success && resNewPageId.data) {
                    parrentId = Number((resNewPageId.data as Types.IConfluPageResp).id);
                } else {
                    parrentId = 0;
                }
            }
            resolve(new ResponseObj(true, 200, parrentId, null,null));
        } catch (error) {
            reject(error);
        }

    })
}