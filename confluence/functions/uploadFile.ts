import * as Types from '../../../types/types';
import fsPromises from 'fs/promises';
import fs from 'fs';
import apiProps from '../../../../secrets';
import ResponseObj from '../../../classes/ResponseObj';
import FormData from "form-data";
import fetch from 'node-fetch';


const connectionProps = apiProps('confluence') as Types.IConfluenceConnectionProps;


export default function uploadFile(parrentId: number | string, file: Express.Multer.File, documentType: string): Promise<Types.IDataResp> {
    return new Promise (async(resolve,reject) => {
        try {
            let filePath = `./uploads/${file.filename}`;
    
            // fs.readdir('./uploads/', (err, files) => {
            //     files.forEach(file => {
            //       console.log(file);
            //     });
            // });
            const fileOriginalName = file.originalname.split(".");
            const fileFormat = fileOriginalName[fileOriginalName.length-1]; 
    
            if(!file.filename.includes(".")) {            
                let fileName = file.filename;
                const currentDate = parseInt((new Date().getTime() / 1000).toFixed(0));
                switch (documentType) {
                    case "HLD":
                        fileName = `HLD_${currentDate}`
                        break;
                    case "DRP":
                        fileName = `DRP_${currentDate}`
                        break;
                    case "roadMap":
                        fileName = `roadMap_${currentDate}`
                        break;                    
                    default:
                        break;
                }
                const newPath = `./uploads/${fileName}.${fileFormat}`;
                await fsPromises.rename(filePath, newPath);
                filePath = newPath;
            }
    
            const form = new FormData();
            // const stats = fs.statSync(filePath);
            // const fileSizeInBytes = stats.size;
            const fileStream = fs.createReadStream(filePath);
            form.append('file', fileStream, file.originalname);
    
            const requestOptions = {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${connectionProps.bearerToken}`,
                    "X-Atlassian-Token": "no-check",
                    'Accept': 'application/json'
                },
                body: form
            };
            const url = `https://${connectionProps.origin}/${connectionProps.path}/${parrentId}/child/attachment`;
            
            fetch(url, requestOptions)
                .then(res => res.json())
                .then(
                    (result) => {
                        fs.unlink(filePath, function(err){
                            if (err) {
                                console.log(err);
                            }
                        }) 
                        
                        if(result.results && result.results[0].status === "current") {
                            resolve(new ResponseObj(true, 200, null, null, null))
                        } else {
                            reject(new ResponseObj(false, 500, null, result, `Не удалось сохранить файлы в страницу ${parrentId}`))
                        }  
                    }          
                );        
        } catch (err) {
            reject(new ResponseObj(false, 500, null, err as {}, `Ошибка при загрузке файлов в страницу ${parrentId}`))
        }
    })    
}