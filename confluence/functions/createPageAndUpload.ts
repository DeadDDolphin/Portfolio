import apiProps from "../../../../secrets";
import checkPageAndGetId from "./checkPageAndGetId";
import * as Types from '../../../types/types'
import uploadData from "./uploadData";
import ResponseObj from "../../../classes/ResponseObj";
import getDateString from "../../../functions/getDateString";
import productPageContent from "./productPageContent";


const connectionProps = apiProps('confluence') as Types.IConfluenceConnectionProps;


export default function createPageAndUpload(uploadingData:Types.IConfluUploadingData):Promise<ResponseObj<null | number | string>> {
    return new Promise(async(resolve, reject) => {
        try {                   
            //Если страница существовала, то переписываем ее
            if(uploadingData.pageId) {
                const uploadResult = await uploadData(uploadingData.pageId, uploadingData.documentType, uploadingData, uploadingData.pageTitle);
                resolve(uploadResult);
            } else {   
                const bodyForParentPage = productPageContent(uploadingData.productName, uploadingData.itemPpiLink, uploadingData.itemSolLink);
                     
                const parrentId = await checkPageAndGetId(connectionProps.rootPageId, uploadingData.pageTitle, bodyForParentPage);

                if(parrentId.success ) {
                    //Создание подстраницы, соответствующей файлу/url
                    const dataPageId = await checkPageAndGetId(parrentId.data, `${uploadingData.pageTitle}_${uploadingData.documentType}`, "");
                    
                    const uploadResult = await uploadData(dataPageId.data, uploadingData.documentType, uploadingData, uploadingData.pageTitle);
                    resolve(uploadResult);
                } else {
                    reject(new ResponseObj(false, 500, null, null, `Не удалось найти либо создать страницу ${uploadingData.pageTitle}`))
                }
            }
        } catch (error) {
            reject(error);
        }
    });
}