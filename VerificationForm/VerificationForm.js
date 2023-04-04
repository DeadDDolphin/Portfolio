import React, { useState, useEffect } from 'react';
import server from "../../server.json";
import CustomSpinner from '../CustomSpinner/CustomSpinner';
import Spinner from 'react-bootstrap/Spinner';
import "./VerificationForm.scss";
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import keyGenerator from '../../functions/KeyGenerator';
import getItProducts from "../../backRequests/getItProducts";
import getProductTeam from "../../backRequests/getProductTeam";
import AdditionalAccordion from '../QuestionComponent/AdditionalAccordion/AdditionalAccordion';
import ProofComponent from "../QuestionComponent/ProofComponent/ProofComponent";
import { OverlayTrigger, Popover, Tooltip } from 'react-bootstrap';


const prodChangesSaveIcon = (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M21.5143 0.661468L25.0929 4.24004L25.7143 5.76147V6.46861H24.6429L23.5714 7.54004V5.76147L19.9929 2.1829H19.2857V10.7543H6.42857V2.1829H2.14286V23.6115H8.57143L7.5 25.7543H2.14286L0 23.6115V2.1829L2.14286 0.0400391H19.9929L21.5143 0.661468V0.661468ZM12.8571 8.52575H17.1429V2.09718H12.8571V8.52575ZM26.7857 8.52575L30 11.74L29.9571 13.2186L18.1714 25.0043L17.8929 25.2615L17.1 26.0543L16.8857 26.2472L10.4571 29.4615L9.02143 28.0258L12.2357 21.5972L12.4286 21.3829L13.2214 20.59L13.4786 20.3115L25.2643 8.52575H26.7857V8.52575ZM13.4571 24.04L12.3429 26.1829L14.5714 25.1543L13.4571 24.04V24.04ZM14.9357 21.8329L16.6286 23.5258L27.6643 12.49L25.9714 10.7972L14.9357 21.8329Z" fill="white"/>
    </svg>
)

const succesSavedIcon = (
    <svg width="31" height="24" viewBox="0 0 31 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30.6892 0H28.1194C27.7592 0 27.4173 0.165435 27.1967 0.448512L12.0392 19.65L4.7711 10.4408C4.66115 10.3012 4.521 10.1883 4.36119 10.1106C4.20137 10.0329 4.02603 9.99247 3.84834 9.99225H1.27859C1.03227 9.99225 0.89625 10.2753 1.04698 10.4665L11.1164 23.2233C11.587 23.8189 12.4914 23.8189 12.9656 23.2233L30.9208 0.47057C31.0715 0.283077 30.9355 0 30.6892 0V0Z" fill="white"/>
    </svg>
)
const confluenceIcon = (
    <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.566753 11.4226C0.405777 11.6852 0.224863 11.9899 0.0712651 12.2327C0.00517774 12.3444 -0.014458 12.4776 0.0165774 12.6036C0.0476129 12.7296 0.126843 12.8384 0.237241 12.9066L3.45815 14.8888C3.51413 14.9233 3.57642 14.9464 3.6414 14.9566C3.70638 14.9669 3.77275 14.9641 3.83664 14.9484C3.90052 14.9327 3.96064 14.9045 4.0135 14.8653C4.06636 14.8261 4.11089 14.7768 4.14449 14.7203C4.27334 14.5047 4.43931 14.2248 4.62017 13.9249C5.89614 11.819 7.17955 12.0766 9.49364 13.1816L12.6873 14.7004C12.7472 14.7289 12.8121 14.7451 12.8784 14.748C12.9446 14.751 13.0108 14.7406 13.0729 14.7175C13.1351 14.6944 13.1919 14.659 13.2402 14.6135C13.2884 14.5681 13.327 14.5134 13.3538 14.4527L14.8874 10.984C14.9395 10.8649 14.9427 10.7302 14.8964 10.6088C14.85 10.4873 14.7578 10.389 14.6397 10.3349C13.9658 10.0177 12.6254 9.38597 11.4188 8.80372C7.07797 6.69524 3.38882 6.83152 0.566814 11.4226H0.566753Z" fill="url(#paint0_linear_315_12)"/>
        <path d="M15.0091 3.55072C15.1701 3.2881 15.351 2.98334 15.5046 2.74054C15.5707 2.62884 15.5903 2.49568 15.5593 2.36967C15.5282 2.24365 15.449 2.13485 15.3386 2.06664L12.1177 0.0845038C12.0613 0.0465329 11.9977 0.0205704 11.9308 0.00823123C11.864 -0.00410795 11.7953 -0.00255989 11.7291 0.0127791C11.6628 0.0281181 11.6005 0.0569199 11.5459 0.0973931C11.4912 0.137866 11.4455 0.189145 11.4116 0.24804C11.2827 0.463589 11.1168 0.743589 10.9358 1.04334C9.65987 3.14932 8.37645 2.8917 6.06237 1.78664L2.87865 0.275296C2.81878 0.246806 2.75381 0.230619 2.68757 0.227694C2.62133 0.224769 2.55518 0.235164 2.49304 0.258266C2.43089 0.281367 2.37402 0.316704 2.32577 0.362184C2.27753 0.407665 2.23891 0.462363 2.21218 0.52304L0.678466 3.99176C0.626406 4.11083 0.6232 4.24558 0.66954 4.36699C0.715879 4.4884 0.808055 4.58674 0.926209 4.64084C1.60011 4.95804 2.94054 5.58981 4.14712 6.17206C8.49779 8.27804 12.187 8.13682 15.009 3.55072H15.0091Z" fill="url(#paint1_linear_315_12)"/>
        <defs>
            <linearGradient id="paint0_linear_315_12" x1="14.8006" y1="15.912" x2="11.1936" y2="7.63731" gradientUnits="userSpaceOnUse">
                <stop offset="0.18" stopColor="#0052CC"/>
                <stop offset="1" stopColor="#2684FF"/>
            </linearGradient>
            <linearGradient id="paint1_linear_315_12" x1="0.775277" y1="-0.941182" x2="4.38793" y2="7.33754" gradientUnits="userSpaceOnUse">
                <stop offset="0.18" stopColor="#0052CC"/>
                <stop offset="1" stopColor="#2684FF"/>
            </linearGradient>
        </defs>
    </svg>
);

const succesIcon = (    
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 0C7.21997 0 5.47991 0.527841 3.99987 1.51677C2.51983 2.50571 1.36628 3.91131 0.685088 5.55585C0.00389953 7.20038 -0.17433 9.00998 0.172936 10.7558C0.520203 12.5016 1.37737 14.1053 2.63604 15.364C3.89471 16.6226 5.49836 17.4798 7.24419 17.8271C8.99002 18.1743 10.7996 17.9961 12.4442 17.3149C14.0887 16.6337 15.4943 15.4802 16.4832 14.0001C17.4722 12.5201 18 10.78 18 9C18 6.61305 17.0518 4.32387 15.364 2.63604C13.6761 0.948212 11.387 0 9 0V0ZM14.8781 5.97937L7.48688 13.365L3.12188 9C2.97269 8.85081 2.88888 8.64848 2.88888 8.4375C2.88888 8.22652 2.97269 8.02418 3.12188 7.875C3.27106 7.72581 3.4734 7.642 3.68438 7.642C3.89536 7.642 4.09769 7.72581 4.24688 7.875L7.49813 11.1262L13.7644 4.86562C13.8382 4.79176 13.9259 4.73316 14.0225 4.69318C14.119 4.65321 14.2224 4.63263 14.3269 4.63263C14.4313 4.63263 14.5348 4.65321 14.6313 4.69318C14.7278 4.73316 14.8155 4.79176 14.8894 4.86562C14.9632 4.93949 15.0218 5.02719 15.0618 5.1237C15.1018 5.22021 15.1224 5.32366 15.1224 5.42812C15.1224 5.53259 15.1018 5.63603 15.0618 5.73255C15.0218 5.82906 14.9632 5.91675 14.8894 5.99062L14.8781 5.97937Z" fill="#04B100"/>
    </svg>    
);

const unsuccesIcon = ( 
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.0002 3.66671C9.05524 3.66671 7.18998 4.43932 5.81471 5.81459C4.43945 7.18986 3.66683 9.05512 3.66683 11C3.66683 12.945 4.43945 14.8102 5.81471 16.1855C7.18998 17.5608 9.05524 18.3334 11.0002 18.3334C12.9451 18.3334 14.8103 17.5608 16.1856 16.1855C17.5609 14.8102 18.3335 12.945 18.3335 11C18.3335 9.05512 17.5609 7.18986 16.1856 5.81459C14.8103 4.43932 12.9451 3.66671 11.0002 3.66671V3.66671ZM1.8335 11C1.8335 5.93729 5.93741 1.83337 11.0002 1.83337C16.0629 1.83337 20.1668 5.93729 20.1668 11C20.1668 16.0628 16.0629 20.1667 11.0002 20.1667C5.93741 20.1667 1.8335 16.0628 1.8335 11ZM7.14375 7.14362C7.31565 6.97178 7.54876 6.87524 7.79183 6.87524C8.0349 6.87524 8.26801 6.97178 8.43991 7.14362L11.0002 9.70387L13.5604 7.14362C13.645 7.05607 13.7461 6.98624 13.858 6.9382C13.9698 6.89016 14.0901 6.86487 14.2118 6.86381C14.3335 6.86275 14.4542 6.88595 14.5669 6.93204C14.6795 6.97813 14.7819 7.04619 14.8679 7.13226C14.954 7.21833 15.0221 7.32068 15.0682 7.43333C15.1143 7.54599 15.1375 7.66669 15.1364 7.78841C15.1353 7.91012 15.11 8.03041 15.062 8.14224C15.014 8.25408 14.9441 8.35523 14.8566 8.43979L12.2963 11L14.8566 13.5603C15.0236 13.7332 15.116 13.9647 15.1139 14.2051C15.1118 14.4454 15.0154 14.6753 14.8454 14.8453C14.6755 15.0152 14.4455 15.1117 14.2052 15.1137C13.9649 15.1158 13.7333 15.0234 13.5604 14.8565L11.0002 12.2962L8.43991 14.8565C8.26703 15.0234 8.03548 15.1158 7.79513 15.1137C7.55478 15.1117 7.32487 15.0152 7.15491 14.8453C6.98496 14.6753 6.88855 14.4454 6.88646 14.2051C6.88437 13.9647 6.97677 13.7332 7.14375 13.5603L9.704 11L7.14375 8.43979C6.9719 8.26789 6.87536 8.03477 6.87536 7.79171C6.87536 7.54864 6.9719 7.31552 7.14375 7.14362V7.14362Z" fill="#F30000"/>
    </svg>
);

const popover = (headerText, body) => {
    return (
        <Popover id="popover-question-component">
          <Popover.Header >{headerText}</Popover.Header>
          <Popover.Body>
            {body}
          </Popover.Body>
        </Popover>
      )
};
const fileTypes = [
    "roadMap",
    "HLD",
    "DRP"
]

const VerificationForm = () => {

    const [path, setPath] = useState(window.location.pathname);
    const [productSolCode, setProductSolCode] = useState(path.split('=')[1]);
    const [verificationStatus, setVerificationStatus] = useState(false);
    const [isConfluenceData, setIsConfluenceData] = useState(false);
    const [error, setError] = useState(false);
    const [isLoaded, setLoaded] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({});
    const [savingStatus, setSavingStatus] = useState(0);    
    const [additionalData, setAdditionalData] = useState([]);
    const [proof, setProof] = useState([]);
    const [fileType, setFileType] = useState(fileTypes[0]);
    const [fileTypeChanged, setFileTypeChanged] = useState(false);
    const [confluenceData, setconfluenceData] = useState({});

    const [isModalConfirm, setModalConfirm] = useState(false);
    /*
     saving statuses^
     0 - default,
     1 - in progress, awaiting server result
     2 - success
     3 - error
    */

    useEffect(() => {
        loadData();
    }, [fileTypeChanged]);

    async function loadData() {

        const productResult = await getProduct();
        
        if(productResult.status === 1) {
            const product = productResult.data[0];
            setCurrentProduct(product);            
        
            // const confluenceResult = await 
            getConfluenceData(fileType, product.product_sol_code);
            // const verification = confluenceResult === 2 ? true : false;
            // const isConflData = confluenceResult === 0 ? false : true;
            // setVerificationStatus(verification);

            const uncompleteProductTeams = [];               
            const completeProductTeams = [];               
            const completeSystemTeams = [];               
            const uncompleteSystemTeams = [];
            const itProducts = await getItProducts(product);

            if(itProducts.itProducts.length > 0) {
                await Promise.all(itProducts.itProducts.map(async(itProduct) => {      
                    const itUrl = `https://sol.mts.ru/new/software/${itProduct.solId}`;

                    const itProductTeam = await getProductTeam(itProduct.solCode);
                    
                    if(itProductTeam.result.length > 0) {
                        itProductTeam.result.forEach(team => {
                            if(team.incident_access === 0) {
                                completeProductTeams.push([                                    
                                    <a className="custom-url" target="_blank" rel="noreferrer" href={itUrl}>{itProduct.name}</a>,
                                    team.support_group_name,
                                    "+"
                                ]);
                            } else {
                                uncompleteProductTeams.push([                                    
                                    <a className="custom-url" target="_blank" rel="noreferrer" href={itUrl}>{itProduct.name}</a>,
                                    team.support_group_name,
                                    "-"
                                ]);
                            }
                        });
                    }

                    
                    if (itProduct.systems.length > 0) {
                        await Promise.all(itProduct.systems.map(async(system) => {
                            const systemTeam = await getProductTeam(system.support_team_id);
                            const systemUrl = `https://ims.msk.mts.ru/Objects/Systems/view.asp?BLOCK=MAIN&ID=${system.SYS_ID}`
                            const appendedData = [
                                <a className="custom-url" target="_blank" rel="noreferrer" href={itUrl}>{itProduct.name}</a>,
                                <a className="custom-url" target="_blank" rel="noreferrer" href={systemUrl}>{system.SYSTEM}</a>,
                                system.status
                            ];
                            
                            if(["Опытно-промышленная эксплуатация",
                            "Промышленная эксплуатация",
                            "MVP"].includes(system.status)) {
                                
                                if(systemTeam.result.length > 0) {
                                    const team = systemTeam.result[0];
                                    appendedData.push(team.support_group_name);
                                    if(team.incident_access === 0) {
                                        appendedData.push("+")
                                        completeSystemTeams.push(appendedData);
                                    } else {
                                        appendedData.push("-")
                                        uncompleteSystemTeams.push(appendedData);
                                    }
                                    
                                } else {
                                    appendedData.push("Отсутствует", "");
                                    uncompleteSystemTeams.push(appendedData);
                                    // systemsWithoutTeams.push({
                                    //     href: `https://ims.msk.mts.ru/Objects/Systems/view.asp?BLOCK=MAIN&ID=${system.SYS_ID}`,
                                    //     value: system.SYSTEM
                                    // });
                                }
                            } else {
                                if(systemTeam.result.length > 0){
                                    const team = systemTeam.result[0];
                                    appendedData.push(team.support_group_name, team.incident_access === 0 ? "+" : "-");
                                } else {
                                    appendedData.push("Отсутствует", "");
                                }
                                uncompleteSystemTeams.push(appendedData);
                            }
                        }));
                    } else {
                        uncompleteSystemTeams.push([
                            <a className="custom-url" target="_blank" rel="noreferrer" href={itUrl}>{itProduct.name}</a>,
                            "Отсутствует",
                            "",
                            "",
                            ""
                        ]);
                        
                    }
                }))
            }

            const dataToAccordion = [];
            dataToAccordion.push({
                header: "Команды систем в эксплуатации с доступом к инцидентам",
                bodyContent: {
                    title: ["IT-продукт", "Система", "Статус", "Команда", "Доступ к инцидентам"],
                    data: completeSystemTeams,
                    notFoundMsg: "Нет связанных систем в статус эксплуатации"
                }
            });
            dataToAccordion.push({
                header: "Неполные даные",
                bodyContent: {
                    title: ["IT-продукт", "Система", "Статус", "Команда", "Доступ к инцидентам"],
                    data: uncompleteSystemTeams,
                    notFoundMsg: `${completeSystemTeams.length > 0 ? "Все данные корректны" : "Нет связанных систем"}`
                }
            });
            
            setAdditionalData(dataToAccordion);          
            setLoaded(true);
        } else if (productResult.status === 0) {
            setProof([{
                type: "text",
                message: "Продукт с заданным SoL-кодом не найден"
            }]);
        } else {
            setProof([{
                type: "text",
                message: "Ошибка получения данных"
            }]);
            setError(true);
        }
    }

    async function getProduct(){
        const productRes = await fetch(`${server.host}:${server.port}/onlyProduct/${productSolCode}`)
            .then(res => res.json())
            .then(
                (result) => {
                    if (result.length === 0) {
                        return {
                            status: 0,
                            data: []
                        };
                    } else {
                        return {
                            status: 1,
                            data: result
                        }
                    }
                },
                (error) => {
                    return {
                        status: -1,
                        data: []
                    }
                });
        
        return productRes;
    }

    
    function saveChanges() {
        const data = new FormData();
        data.append('pageTitle', currentProduct.product_sol_code);
        data.append('dataContext', fileType);
        data.append('verification', verificationStatus);

        const requestOptions = {
            method: 'POST',
            body: data
        };
        setSavingStatus(1);

        fetch(`${server.host}:${server.port}/uploadData`, requestOptions)
            .then(res => res.json())
            .then(
                (result) => {
                    if(result.updateResult){
                        if(result.updateResult === "success"){
                            setSavingStatus(2);
                            setTimeout(() => {
                                setSavingStatus(0);
                            }, 3000);                            
                        } else {
                            setSavingStatus(3);
                        }
                    } else {
                        setSavingStatus(3);
                    }
                },
                (error) => {
                    alert(error);
                }
            );
    }

    async function getConfluenceData(fileType, solCode) {
        const data = {
            dataContext: fileType,
            pageTitle: solCode
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify(data)
        };
        /*
         0 - no data;
         1 - there is data, no verification;
         2 - there is data, verificated
        */        
        fetch(`${server.host}:${server.port}/getConfluenceData`, requestOptions)
            .then(res => res.json())
            .then(
                (result) => {
                    setconfluenceData(result.result);
                    setIsConfluenceData(true);
                    // if(result.result.urls.length > 0 || result.result.files.length > 0){
                    //     if( result.result.verification === 1) {
                    //         return 2;
                    //     } else {
                    //         return 1;
                    //     }
                    // } else {
                    //     return 0;
                    // }
                },
                (error) => {
                    console.log(error);
                }
            );
        
    }

    function changeDelBtn(newVal, option) {

        const btn = document.getElementById("deleteConfluenceData");
        btn.innerHTML = newVal;
        btn.classList.add(`${option}-border`);
    
        setTimeout(() => {  
            btn.classList.remove(`${option}-border`);
            btn.innerHTML = "Удалить данные";
        }, 3000);
    }

    async function confirmDelete() {
        const deleteResult = await deleteConfluenceData(fileType, currentProduct.product_sol_code);

        if(deleteResult.success) {
            if(deleteResult.status_code === 204) {
                changeDelBtn(deleteResult.data, "error")
            } else if( deleteResult.status_code === 200) {
                changeDelBtn("Успешно удалено", "success")
            }
        } else {
            changeDelBtn("Ошибка удаления", "error")
        }

        setModalConfirm(false);
    }

    async function deleteConfluenceData(fileType, solCode) {
        const data = {
            dataContext: fileType,
            pageTitle: solCode
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                "Content-Type":"application/json"
            },
            body: JSON.stringify(data)
        };
        /*
         0 - no data;
         1 - there is data, no verification;
         2 - there is data, verificated
        */        
        return await fetch(`${server.host}:${server.port}/deleteData`, requestOptions)
            .then(res => res.json())
            .then(
                (result) => {
                    return result;
                },
                (error) => {
                    return error;
                }
            );
    }

    function verificationDisplay(verification) {
        if(verification === 1) {
            return (
                <div>
                    {succesIcon} - Верификация пройдена
                </div>
            );
        } else if(verification === 0) {
            return (
                <div>
                    {unsuccesIcon} - Верификация не пройдена
                </div>
            );
        }
    }

    function newPortalLink(inpLogin, inpName) {
        const newPortalLink = 'https://newportal.mts.ru/my/Person.aspx?accountname=';
        if (!inpLogin) {
            return 'не указан';
        }

        const login = inpLogin.replace('\\','%5C');
        const name = inpName;
        if (login.length > 0 && login !== 'отсутствует' && login !== 'team_sol') {
            return (<a className='new-portal-link' href={newPortalLink + login} target="_blank" rel="noreferrer">{name}</a>);
        } else if (login.length > 0 && login === 'team_sol') {
            return 'не указан';
        } else return 'не указан';
    }

    const changeFileType = (event) => {
        setFileType(event.target.value);
        setLoaded(false);
        setFileTypeChanged(!fileTypeChanged);
    }

    function statusSelect(){
        return (
            <select  
                className={`options-select`}  
                id="fileTypeSelect" name="fileTypeSelect" 
                onChange={changeFileType} 
                value={fileType}
            >
                {fileTypes.map(elem => <option key={keyGenerator()} value={elem}>{elem}</option>)}
            </select>
        )
    }

    return (
        <div className='main-content'>     
            <div className='main-container'>   
                {error ? 
                    "Ошибка загрузки данных" : isLoaded ? 
                            <div className='custom-redact-container'>
                                <div className="main-container__header">
                                    <h5 className="header__title">                                        
                                        <a className="header__title__link"
                                            href={
                                                `https://sol.mts.ru/new/${currentProduct.product_type === "mtsProduct" ?
                                                    "products" : "software"}/${currentProduct.product_sol_id}`
                                            }
                                            target="_blank" rel="noreferrer"
                                        >
                                            {`${currentProduct.product_sol_code} - ${currentProduct.product_name}`}
                                        </a> 
                                    </h5>
                                    <div className="main-btns-container">
                                        <div  className="options-select-container">
                                            {statusSelect()}
                                        </div> 
                                        {/* <div className="save-btn-content">
                                            <button className="button btn btn-outline-success" id="saveChanges" onClick={saveProductChanges}>Сохранить изменения</button>
                                        </div> */}
                                    </div>
                                </div>
                                <div className='content-scrollbar-panel'>
                                    <div className='confluence-data-control'>
                                        <div className="info-block">
                                            <div className='url-content'>
                                                <OverlayTrigger placement="top" overlay={
                                                    (
                                                        <Tooltip id={"toolTip_" + fileType + "_" + currentProduct.product_sol_code}>                                                    
                                                            {confluenceData.files.length > 0 ? <span>Загружено вложение<br/></span> : ""}
                                                            {confluenceData.urls.length > 0 ? <span>Приложена ссылка</span> : ""}
                                                            {confluenceData.urls.length === 0 && confluenceData.files.length === 0 ? <span>Нет загруженных данных</span> : ""}
                                                        </Tooltip>
                                                    )
                                                }>
                                                    <a className="url-with-icon"
                                                        href={
                                                            `https://confluence.mts.ru/display/MCC/${currentProduct.product_sol_code}_${fileType}`
                                                        }
                                                        target="_blank" rel="noreferrer"
                                                    >
                                                        <span className='icon-url-text'>Данные на Confluence</span>
                                                        {confluenceIcon}  
                                                    </a>
                                                </OverlayTrigger>                                                
                                                <span>
                                                    {confluenceData.verification !== -1 ? verificationDisplay(confluenceData.verification) : ""}
                                                </span>
                                            </div>  
                                            {isConfluenceData ? 
                                                <div className='verification-btns'>
                                                    <button className="btn btn-secondary" id="deleteConfluenceData"
                                                        onClick={() => setModalConfirm(true)}>Удалить данные</button>
                                                    <ModalConfirm showModal={isModalConfirm}
                                                        key={keyGenerator()}
                                                        bodyTxt={"Данное действие безвозратно удалит данные. Перед продолжением убедитесь, что данные действительно необходимо удалить."} 
                                                        onHide={() => setModalConfirm(false)} 
                                                        handleSubmit={confirmDelete}
                                                    />
                                                    <button className="btn btn-success"
                                                        onClick={() => setVerificationStatus(true)}>Верифицирован</button>
                                                    <button className="btn btn-danger"
                                                        onClick={() => setVerificationStatus(false)}>Не верифицирован</button>
                                                </div> : 
                                                "Маршрутная карта не загружена"
                                            }                                                  
                                        </div>
                                    </div>
                                    <div className='content-product-info'>
                                        Владелец продукта: {newPortalLink(currentProduct.product_owner_login, currentProduct.product_owner_name)}
                                    </div>
                                    <div className="content-panel">
                                        <div className='data-container'>
                                            {proof.length > 0 ? 
                                                <ProofComponent data={proof} /> : ""}
                                            <AdditionalAccordion items={additionalData}/>
                                        </div>
                                    </div>
                                </div>                                                        
                                <div className={'save-btn-content ' + (savingStatus === 2 ? 'status-success' : '')}>
                                    <div id="saveChanges" onClick={saveChanges}>
                                        {savingStatus === 0 ? prodChangesSaveIcon : savingStatus === 1 ? <Spinner animation="border" variant="light" /> : savingStatus === 2 ? succesSavedIcon : 'ER'}
                                    </div>
                                </div> 
                            </div> :                            
                        <CustomSpinner/>
                }
            </div>
        </div>
    );
};

export default VerificationForm;



