import apiProps from "../../../../secrets";
import ResponseObj from "../../../classes/ResponseObj";
import getChildPages from "./getChildPages";
import * as Types from '../../../types/types'

const connectionProps = apiProps('confluence') as Types.IConfluenceConnectionProps;
/**
 * Функция для переименовывания всех страниц конфлюэнс в ветке "Продукты интегрированные в МСС"
 * @param limit - ограничение на количество получаемых страниц для перименования
 * @returns Промис с объектом, где данные - строка об успешности выполнения
 */
export default function getAllChildPages(limit?: number, start?: number): Promise<ResponseObj<Types.IConfluenceChildPageData[]>> {
    return new Promise(async (resolve, reject) => {
        try {
            //Всего страниц 165, лимит на всякий 200
            const secondLvlPagesResp = await getChildPages(connectionProps.rootPageId, limit, start) as any;
            resolve(secondLvlPagesResp)
        }catch(error) {
            reject(error);
        }
    })
}