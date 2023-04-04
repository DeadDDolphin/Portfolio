import ResponseObj from "../../../classes/ResponseObj";
import * as Types from '../../../types/types';
import getChildPages from "./getChildPages";
import getDocumentStatusAndUrl from "./getDocumentStatusAndUrl";

export default function getAllProductDocuments(pageId: string): Promise<ResponseObj<Types.IProdDocumentData[]>> {
    const documentTypesCatalog = [
        "roadMap",
        "DRP",
        "HLD"
    ];

    return new Promise(async (resolve, reject) => {
        try {
            const allProdDocChildPages = await getChildPages(pageId);

            if (allProdDocChildPages.success) {
                const promisesResult: ResponseObj<Types.IProdDocumentData>[] = [];
                const pages = allProdDocChildPages.data;
                let i = 0;
                const end = allProdDocChildPages.data.length;

                const process = async () => {
                    const getDocsData = await new Promise(async (resolve) => {
                        try {
                            const pageDocsResp = await getDocumentStatusAndUrl('id', pages[i].pageId)

                            resolve(pageDocsResp)
                        } catch (error) {
                            // console.log(error);
                            resolve(error as ResponseObj<Types.IProdDocumentData>);
                        }
                    }) as ResponseObj<Types.IProdDocumentData>

                    i++;
                    if (i < end) {
                        setTimeout(process, 1000);
                    }
                    promisesResult.push(getDocsData);

                }

                await process();


                const success = promisesResult.filter(item => item.success);
                const errors = promisesResult.filter(item => !item.success);
                if (success.length > 0) {
                    resolve(new ResponseObj(true, 200, success.map(item => item.data),
                        errors.length > 0 ? { errors: errors.map(item => item.error) } : null, null))
                } else {
                    reject(new ResponseObj(true, 200, null,
                        errors.length > 0 ? { errors: errors.map(item => item.error) } : null, `Не удалось получить документы с дочерних страниц, см. error`))
                }
            } else {
                reject(allProdDocChildPages)
            }
        } catch (error) {
            reject(error);
        }
    });
}