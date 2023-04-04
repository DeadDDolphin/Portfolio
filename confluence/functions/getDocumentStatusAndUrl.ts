import ResponseObj from "../../../classes/ResponseObj";
import * as Types from '../../../types/types';
import confluenceApiRequest from "./confluenceApiRequest";


export default function getDocumentStatusAndUrl(dataType: string, value: string): Promise<ResponseObj<Types.IProdDocumentData>> {
    const space = 'MCC';

    return new Promise (async(resolve, reject) => {
        try {
            let id: string|null = null;
            if(dataType === 'title') {
                const pageResult = await confluenceApiRequest({
                    methodType: "getPageByTitle",
                    data: {
                        pageTitle: value, 
                        space: space
                    }
                });
                if(pageResult.data){                    
                    id = (pageResult.data as Types.IConfluPageResp).id;
                } else {
                    id = null
                }
                
            } else if(dataType === 'id') {
                id = value;
            }
            

            if(id) {
                const pageDataResult = await confluenceApiRequest({
                    methodType: "getPageDataById",
                    data: {
                        pageId: id
                    }
                });
                const bodyContent = (pageDataResult.data as Types.IConfluPageData).bodyContent;

                //Для получения типа документа забираем последнюю часть названия, отделённую нижним подчеркиванием. 
                const splitedTitle = (pageDataResult.data as Types.IConfluPageData).pageTitle.split("_");
                const documentType = splitedTitle[splitedTitle.length - 1];

                //Если на странице есть картинка с галочкой, то она верифицирована = 1,
                // если картинка с крестиком, то не верифицирована = 0, если нету - то ошибка, -1
                const verification = bodyContent.includes("check.svg") ? 1 : bodyContent.includes("error.svg") ? 0 : -1;

                //Находим ссылки на странице
                const regexpUrl = /(?<=href=")(https?:\/\/)?([\w-]{1,32}\.[\w-]{1,32})[^\s@"<>]*/gi;
                const matches = bodyContent.match(regexpUrl);

                //Убираем повторения ссылок
                const urls = [...Array.from(new Set(matches))];

                const pageAttachmentsResult = await confluenceApiRequest({
                    methodType: "getPageAttachments",
                    data: {
                        pageId: id
                    }
                });
                const files = pageAttachmentsResult.data as Types.IConfluFileData[];

                //Если есть ссылки либо файлы, то проверяем верификацию.
                //Если верифицировано, то статус документа 2 - предоставлен и верифицирован
                //Если не верифицировано, то статус документа 1 - предоставлен, но не верифицирован
                //Иначе статус 0 - не предоставлен
                const documentStatus = urls.length > 0 || files.length > 0 ? verification === 1 ? 2 : 1 : 0;
                
                const documentPageUrl = `https://confluence.mts.ru/pages/viewpage.action?pageId=${id}`;

                resolve(new ResponseObj(true, 200, 
                    {
                        prodDocumentType: documentType,
                        prodDocumentUrl: documentPageUrl,
                        prodDocumentStatus: documentStatus
                    } as Types.IProdDocumentData, null, null));
            } else {
                reject(new ResponseObj(true, 200, 
                    null, `getDocumentsStatusAndUrl - ID страницы имеет пустое значение. Был передан ${value}. Id = ${id}`, 
                    `getDocumentsStatusAndUrl - ID страницы имеет пустое значение. Был передан ${value}. Id = ${id}`));
            }
        } catch (error) {
            reject(error);
        }
    })
}