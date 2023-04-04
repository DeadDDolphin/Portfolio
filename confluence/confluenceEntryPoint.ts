import * as Types from '../../types/types';
import ResponseObj from "../../classes/ResponseObj";
import getAllProductDocuments from "./functions/getAllProductDocuments";
import createPageAndUpload from './functions/createPageAndUpload';
import updateInstanceDoc from '../../dbLocal/functions/updateInstanceDoc';
import scoringController from '../../scoring/scoringController';
import getDocumentStatusAndUrl from './functions/getDocumentStatusAndUrl';
import getAllChildPages from './functions/getAllChildPages';
import deletePage from './functions/deletePage';
import updatePage from './functions/updatePage';
import uploadData from './functions/uploadData';
import deleteInstanceDocRow from '../../dbLocal/functions/deleteInstanceDocRow';
import mailController from '../../mail/mailController';

/**
 * Функция для работы с API Confluence. Получение данных страниц, создание страниц, загрузка данных.
 * @param methodType параметр для выбора метода 
 *  - getProductDocs - получение документов продукта по метке (код SOL)
 *  - prodsArrayWithDocs - получение документов для массива продуктов
 *  - getDocDataById - получить данные по ID страницы
 * @param data данные (метка продукта etc.)
 * @param file (опционально) файл для загрузки
 * @returns Промис с данными @type {Promise<ResponseObj<Types.IProdDocumentData[] | Types.IProdWithDocs[]>>}
 */
export default function confluenceEntryPoint(methodType: string, data?: string | Types.IProdIdObject[] | Types.IConfluUploadingData, file?: Express.Multer.File):
    Promise<ResponseObj<Types.IProdDocumentData[] | Types.IProdWithDocs[] | Types.IProdDocumentData | Types.IConfluenceChildPageData[] | null | string> | Types.IDataResp> {
    return new Promise(async (resolve, reject) => {
        switch (methodType) {
            case "getProductDocs":
                try {
                    const productDocsResult = await getAllProductDocuments(data as string);
                    resolve(productDocsResult);
                } catch (error) {
                    reject(error);
                }
                break;
            case "getDocDataById":
                try {
                    const docResult = await getDocumentStatusAndUrl('id', data as string);
                    resolve(docResult);
                } catch (error) {
                    reject(error);
                }
                break;
            case "getAllChildPages":
                try {
                    const allPages = await getAllChildPages(200);
                    resolve(allPages);
                } catch (error) {
                    reject(error);
                }
                break;
            case "uploadData":
                try {
                    // console.log(data);
                    const uploadingData = { ...data as Types.IConfluUploadingData, file: file };
                    const uploadRes = await createPageAndUpload(uploadingData);
                    // console.log('uploadRes', uploadRes);
                    if (uploadRes.success) {
                        const updateRes = await updateInstanceDoc(uploadingData.pageTitle, uploadRes.data as number, uploadingData.documentType);
                        // console.log('updateRes', updateRes);
                        if (updateRes.success) {
                            try {
                                const mailerRes = await mailController('mailAboutDocumentUpload', uploadingData);
                                // console.log('mail res',mailerRes)
                            } catch (error) {
                                console.log(error);
                            }

                            const result = await scoringController("scoreInstanceProductMCC", uploadingData.pageTitle);
                            // console.log('scoringRes', result);
                            resolve(result);
                        } else {
                            reject(new ResponseObj(false, 500, null, 'Не удалось сохранить данные по документам', 'Не удалось сохранить данные по документам'))
                        }
                    } else {
                        reject(new ResponseObj(false, 500, null, 'Не удалось загрузить данные на Confluence', 'Не удалось загрузить данные на Confluence'))
                    }
                } catch (error) {
                    reject(error)
                }
                break;
            case 'deletePage':
                try {
                    const uploadingData = data as Types.IConfluUploadingData;
                    const delRes = await deletePage(uploadingData.pageId as string);
                    if(delRes.success) {                        
                        const delRowRes = await deleteInstanceDocRow(uploadingData.pageId as string, uploadingData.documentType as string);
                        resolve(delRowRes);
                    } else {
                        reject(delRes);
                    }
                } catch (error) {
                    reject(error)
                }
                break;
            case 'changeVerification':
                try {
                    const uploadingData = data as Types.IConfluUploadingData;
                    if (uploadingData.pageId) {
                        const changeVerificationRes = await uploadData(uploadingData.pageId, uploadingData.documentType, uploadingData) as Types.IDataResp;

                        if (changeVerificationRes.success) {
                            const updateRes = await updateInstanceDoc(uploadingData.pageTitle, uploadingData.pageId, uploadingData.documentType, uploadingData.verification ? 2 : 1);

                            if (updateRes.success) {
                                const result = await scoringController("scoreInstanceProductMCC", uploadingData.pageTitle);
                                resolve(result);
                            } else {
                                reject(new ResponseObj(false, 500, null, 'Не удалось сохранить данные по документам', 'Не удалось сохранить данные по документам'))
                            }
                        } else {
                            reject(new ResponseObj(false, 500, null, `Не удалось обновить статус верификации документа ${uploadingData.pageId}`, 
                            `Не удалось обновить статус верификации документа ${uploadingData.pageId}`))
                        }
                    } else {
                        reject(new ResponseObj(false, 500, null, `Отсутствует ID страницы в теле запроса`, `Отсутствует ID страницы в теле запроса`))
                    }
                } catch (error) {
                    reject(error)
                }
                break;
            default:
                break;
        }
    })
}

