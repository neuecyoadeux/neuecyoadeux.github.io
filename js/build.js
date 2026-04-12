import{createBuild,deleteBuild,exportBuild,getAllBuilds,getSelectedBuild,getSelectedBuildId,importBuild,loadState,selectBuild,updateSelectedBuildScore,toFixedTrim,getBuildErrors,updateScore,saveSelectedBuild,measureText,getBuild,saveBuild,switchTab,SIMPLE_MULTI_SELECT_ITEMS,MULTIPLE_SELECT_ITEM_DATA,getMetadata,mulberry32,TAKEOUT_ORDER_ITEM_NAME_MAP,TAKEOUT_ORDER_COSTS}from"./common.js";import{initImageViewer,showImageViewer,hideImageViewer,showImageHover,updateImageHover,hideImageHover}from'./imageViewer.js';import{calculateTakeoutOrderCost,calculateTakeoutOrderKarma,updateItemFromBuildsPage,calculateTheExchangeCost}from"./index.js";import{initTooltip,showTooltipHover,updateTooltipHover,hideTooltipHover}from'./tooltip.js';let itemData;let builds;const EMPTY_HTML='<span class="empty-list">-empty-</span>';export function initBuildPage(loadedItems,loadedFootnotes){itemData=loadedItems;initUI();syncState();}
function initUI(){initImageViewer();initTooltip();document.getElementById('build-table-container').addEventListener("click",e=>{if(e.target.matches('.create-build')){createBuild();syncState();}
if(e.target.matches('.select-build')){let buildId=parseInt(e.target.parentElement.parentElement.dataset.buildId);selectBuild(buildId);syncState();}
if(e.target.matches('.delete-build')){let buildId=parseInt(e.target.parentElement.parentElement.dataset.buildId);deleteBuild(buildId);syncState();}
if(e.target.matches('.export-build')){let buildId=parseInt(e.target.parentElement.parentElement.dataset.buildId);exportBuild(buildId);syncState();}
if(e.target.matches('.import-build')){importBuild().then(()=>{syncState();});}
if(e.target.matches('.build-table-name-text')){let buildId=parseInt(e.target.parentElement.parentElement.dataset.buildId);let build=getBuild(buildId);let buildRow=document.querySelector(`tr.build-table-row[data-build-id="${buildId}"]`);buildRow.classList.add('editing-name');let buildNameInput=buildRow.querySelector('.build-table-name-input input');buildNameInput.value=build.name;buildNameInput.focus();buildNameInput.select();document.querySelectorAll('tr.build-table-row').forEach(buildRow2=>{let buildId2=buildRow2.dataset.buildId;if(buildId2==buildId){return;}
if(buildRow2.classList.contains('editing-name')){buildRow2.classList.remove('editing-name');let build2=getBuild(buildId2);build2.name=buildRow2.querySelector('input').value.trim();saveBuild(buildId2,build2);buildRow2.querySelector('.build-table-name-text').innerHTML=build2.name;}});e.stopPropagation();e.stopImmediatePropagation();}else if(!e.target.matches('input')){document.querySelectorAll('tr.build-table-row').forEach(buildRow=>{let buildId=buildRow.dataset.buildId;if(buildRow.classList.contains('editing-name')){buildRow.classList.remove('editing-name');let build=getBuild(buildId);build.name=buildRow.querySelector('input').value.trim();saveBuild(buildId,build);buildRow.querySelector('.build-table-name-text').innerHTML=build.name;}});}});document.getElementById('build-table-container').addEventListener('keydown',e=>{if(e.target.matches('.build-table-name-input input')){let buildId=parseInt(e.target.parentElement.parentElement.parentElement.dataset.buildId);let buildRow=document.querySelector(`tr[data-build-id="${buildId}"]`);if(e.key=='Enter'){buildRow.classList.remove('editing-name');let build=getBuild(buildId);build.name=e.target.value.trim();saveBuild(buildId,build);buildRow.querySelector('.build-table-name-text').innerHTML=build.name;e.preventDefault();}}});document.querySelectorAll('.table-container').forEach(container=>{container.addEventListener('click',e=>{if(e.target.matches('td.remove-button.miracle > a')){let choice=e.target.dataset.c;let build=getSelectedBuild();build.multipleSelectItemCounts.itsAMiracle.delete(choice);saveSelectedBuild(build);syncState();return;}
if(e.target.matches('td.remove-button.takeout > a')){let choice=e.target.dataset.c;let build=getSelectedBuild();build.multipleSelectItemCounts.takeoutOrder[choice]=0;saveSelectedBuild(build);syncState();return;}
if(e.target.matches('td.remove-button > a')){let itemId=e.target.parentElement.parentElement.dataset.itemId;let build=getSelectedBuild();deselectItem(build,itemId);syncState();}
if(e.target.parentElement&&e.target.parentElement.parentElement&&e.target.parentElement.parentElement.matches('.icon')){e.preventDefault();e.stopPropagation();let id=e.target.parentElement.parentElement.parentElement.dataset.itemId;showImageViewer(id);}
if(e.target.matches('a.build-item-link')){let hash=e.target.getAttribute('href');if(location.hash=hash){location.hash='';}
switchTab(0);}});container.addEventListener('mouseover',e=>{if(e.target.parentElement&&e.target.parentElement.parentElement&&e.target.parentElement.parentElement.matches('.icon')){let id=e.target.parentElement.parentElement.parentElement.dataset.itemId;showImageHover(e,id);}
if(e.target.parentElement&&e.target.parentElement.matches('.name')){let id=e.target.parentElement.parentElement.dataset.itemId;let tooltipHTML=getTooltipHTML(id);if(tooltipHTML){showTooltipHover(e,tooltipHTML);}}});container.addEventListener('mousemove',e=>{if(e.target.parentElement&&e.target.parentElement.parentElement&&e.target.parentElement.parentElement.matches('.icon')){updateImageHover(e);}
if(e.target.parentElement&&e.target.parentElement.matches('.name')){updateTooltipHover(e);}});container.addEventListener('mouseout',e=>{if(e.target.parentElement&&e.target.parentElement.parentElement&&e.target.parentElement.parentElement.matches('.icon')){hideImageHover();}
if(e.target.parentElement&&e.target.parentElement.matches('.name')){hideTooltipHover();}});})}
function syncState(){builds=getAllBuilds();updateUI();}
function updateUI(){updateScore();let buildTableContainer=document.getElementById('build-table-container');buildTableContainer.innerHTML=`<table id="build-table"><tr>
        <th>(?)</th>
        <th>Points</th>
        <th>Name</th>
        <th>Runs</th>
        <th>Items</th>
        <th>Select</th>
        <th>Export</th>
        <th>Delete</th>
    </tr>`+[...builds.entries()].map(([buildId,build])=>{let errors=getBuildErrors(buildId);let errorIcon=errors===null?'<td></td>':`<td class="build-table-error-icon" title="${errors.join(" ")}">(!)</td>`;let selectButton=getSelectedBuildId()==buildId?'<td>Selected</td>':'<td><a class="select-build">Select</a></td>';let selectedBuildClass=getSelectedBuildId()==buildId?'selected-build':'';let runsGreyed=build.runCount==0?'greyed':'';let itemsGreyed=build.itemCount==0?'greyed':'';let pointsRedded=build.remainingPoints<0?'redded':'';let pointsGreyed=build.currentPoints==0?'greyed':'';return`<tr class="build-table-row ${selectedBuildClass}" data-build-id="${buildId}">
            ${errorIcon}
            <td class="build-table-points"><span class="${pointsRedded} ${pointsGreyed}">${toFixedTrim(build.currentPoints, 3)}</span> <span class="greyed">/</span> ${build.totalPoints}</td>
            <td class="build-table-name"><span class="build-table-name-text">${build.name}</span><span class="build-table-name-input"><input type="text"></span></td>
            <td class="build-table-runs ${runsGreyed}">${build.runCount}</td>
            <td class="build-table-items ${itemsGreyed}">${build.itemCount}</td>
            ${selectButton}
            <td><a class="export-build">Export</a></td>
            <td><a class="delete-build">Delete</a></td>
        </tr>`;}).join('')+'</table><div class="build-row build-row-controls"><a class="create-build">New Build</a> <a class="import-build">Import Build</a></div>';let build=getSelectedBuild();function isRun(x){return typeof x==='string'&&x.length>0&&x.includes('R');}
function isItem(x){return typeof x==='string'&&x.length>0&&x.includes('U');}
function isAddon(x){return typeof x==='string'&&x.includes('-A');}
function renderItem(id,items,depth=0){if(depth>20){console.log(`Addon recursion limit reached for ${id}.`);}
let item=itemData[id];if(!item){return'';}
let itemCost=item.cost;if(itemCost===null||itemCost===undefined){itemCost='';}
if(SIMPLE_MULTI_SELECT_ITEMS.has(id)){itemCost=MULTIPLE_SELECT_ITEM_DATA[id].pointCost(build.multipleSelectItemCounts[id]);}
if(id=="U1983"){itemCost=0;}
if(id=="U0990"){itemCost=-calculateTakeoutOrderCost();}
if(id=="U1463"){itemCost=build.multipleSelectItemCounts.daemonToolsChoice==1?-5:-34;}
if(id=='U1851'){itemCost='???';if(Object.hasOwn(build,'lastDigit')){itemCost=-5;itemCost+=build.lastDigit;if(Object.hasOwn(build,'lastDigitDubs')&&build.lastDigitDubs){itemCost+=10;}}}
if(id=='U1808-A0000'){itemCost=-(build.customCostValue??10);}
if(id=='U1605'){itemCost=getMetadata().options.hasAutism?-30:-50;}
if(id=='U1015'){itemCost=calculateTheExchangeCost();}
if(itemCost>0){itemCost='+'+itemCost;}else{itemCost=''+itemCost;}
const defaultItemCostFontSize=14;let itemCostFontSize=defaultItemCostFontSize;if(itemCost!==''){let measuredWidth=measureText(''+itemCost,defaultItemCostFontSize,true);if(measuredWidth>64){itemCostFontSize=Math.max(4,Math.floor(itemCostFontSize*64/measuredWidth));}}
let costTD=itemCost===''?'':`<td class="cost" style="font-size: ${itemCostFontSize}px;"><span>${itemCost}</span></td>`;let colCount=itemCost===''?3:4;let hasDescription=!!getTooltipHTML(id);let itemName=item.name;if(SIMPLE_MULTI_SELECT_ITEMS.has(id)&&id!="U0502"){itemName=build.multipleSelectItemCounts[id]>1?MULTIPLE_SELECT_ITEM_DATA[id].multiText(build.multipleSelectItemCounts[id],MULTIPLE_SELECT_ITEM_DATA[id].increment):MULTIPLE_SELECT_ITEM_DATA[id].singleText;}
if(id=="U1463"){itemName+=build.multipleSelectItemCounts.daemonToolsChoice==1?" [Harbor Freight]":" [DeWalt]";}
let result=`<tr data-item-id="${id}">
            <td class="icon"><a href="i/${id}.webp"><img src="t/${id}.avif"/></a></td>
            ${costTD}
            <td class="name"><a href="#${id}" class="build-item-link${hasDescription ? ' has-description' : ''}">${itemName}</a></td>
            <td class="remove-button"><a>Remove</a></td>
        </tr>`;if(id=="U1983"){result+=`<tr><td class="td-container" colspan="4"><table>`;for(let choice of build.multipleSelectItemCounts.itsAMiracle){result+=`<tr data-item-id="${id}">
                    <td style="width:32px"></td>
                    <td class="cost" style="font-size: 14px;"><span>-15</span></td>
                    <td class="name">${choice}</td>
                    <td class="remove-button miracle"><a data-c='${choice}'>Remove</a></td>`;}
result+='</table></td></tr>';}
if(id=="U0990"){result+=`<tr><td class="td-container" colspan="4"><table>`;for(let[item,amount]of Object.entries(build.multipleSelectItemCounts.takeoutOrder)){if(item=="signature"||amount==0){continue;}
if(item=="tip"){result+=`<tr data-item-id="${id}">
                        <td style="width:32px"></td>
                        <td class="cost" style="font-size: 14px;"><span>-${amount}</span></td>
                        <td class="name">${TAKEOUT_ORDER_ITEM_NAME_MAP[item]}</td>
                        <td class="remove-button takeout"><a data-c='${item}'>Remove</a></td>`;continue;}
if(item=="fourEggRolls"){result+=`<tr data-item-id="${id}">
                        <td style="width:32px"></td>
                        <td class="cost" style="font-size: 14px;"><span>-${TAKEOUT_ORDER_COSTS[item] * amount}</span></td>
                        <td class="name">${4 * amount} ${TAKEOUT_ORDER_ITEM_NAME_MAP[item]}</td>
                        <td class="remove-button takeout"><a data-c='${item}'>Remove</a></td>`;continue;}
result+=`<tr data-item-id="${id}">
                    <td style="width:32px"></td>
                    <td class="cost" style="font-size: 14px;"><span>-${TAKEOUT_ORDER_COSTS[item] * amount}</span></td>
                    <td class="name">${amount} ${TAKEOUT_ORDER_ITEM_NAME_MAP[item]}</td>
                    <td class="remove-button takeout"><a data-c='${item}'>Remove</a></td>`;}
result+='</table></td></tr>';}
if(item.childIds&&item.childIds.some(x=>items.includes(x))){result+=`<tr><td class="td-container" colspan="${colCount}"><table>`;for(let childId of item.childIds){if(items.includes(childId)){result+=renderItem(childId,items,depth+1);}}
result+='</table></td></tr>';}
return result;}
let runListContainer=document.getElementById('run-table-container');let selectedRuns=[...build.items].filter(x=>isRun(x));runListContainer.innerHTML=selectedRuns.filter(x=>!isAddon(x)).map(id=>renderItem(id,selectedRuns)).join('');if(!runListContainer.innerHTML){runListContainer.innerHTML=EMPTY_HTML;}
let itemListContainer=document.getElementById('item-table-container');let selectedItems=[...build.items].filter(x=>isItem(x));itemListContainer.innerHTML=selectedItems.filter(x=>!isAddon(x)).map(id=>renderItem(id,selectedItems)).join('');if(!itemListContainer.innerHTML){itemListContainer.innerHTML=EMPTY_HTML;}
let statListContainer=document.getElementById('stat-list-container');let statsParsed=[...build.items].filter(id=>{if(id=='U1953'){return false;}
let item=itemData[id];if(!item){return false;}
return!!item.stats;}).flatMap(id=>{let item=itemData[id];return item.stats.map(stat=>[parseNumber(stat[0]),stat[1]?stat[1]:""]);});if(build.items.has('U1808-A0000')){if(Object.hasOwn(build,'customCostValue')&&build.customCostValue!=10){statsParsed.push([{number:build.customCostValue-10},'Karma']);}}
if(build.items.has('U1298')){let seed=getMetadata().seed+build.id;seed+=1298;let rng=mulberry32(seed);let roll=Math.floor(rng()*8)+1;if(roll==8){statsParsed.push([{number:1},'Shimmer']);}}
if(build.items.has('U0990')){let karma=calculateTakeoutOrderKarma();if(karma!=0){statsParsed.push([{number:karma},"Karma"]);}}
if(build.items.has('U1463')){if(build.multipleSelectItemCounts.daemonToolsChoice=="1"){statsParsed.push([{number:1},"ringworm infection"]);}
else{statsParsed.push([{number:-1},"Soul"]);}}
let statsSummed={};for(let[amount,stat]of statsParsed){if(stat in statsSummed){if(amount.number===undefined){statsSummed[stat].symbol.push(amount.symbol);}
else{if(statsSummed[stat].number===null){statsSummed[stat].number=amount.number;}
else{statsSummed[stat].number+=amount.number;}}}else{statsSummed[stat]={number:null,symbol:[]};if(amount.number===undefined){statsSummed[stat].symbol.push(amount.symbol);}
else{statsSummed[stat].number=amount.number;}}}
if(build.items.has('U1436')){delete statsSummed['Ach'];}
if(build.items.has('U0633')){delete statsSummed['Points'];}
if(build.items.has('U0955')){delete statsSummed['Spd'];}
let statEntries=Object.entries(statsSummed).map(([stat,amount])=>{let statText='';if(amount.number!==null){let hue=hashToHue(stat??amount.symbol);let colorBackground=statBackgroundColor(hue);let colorText=statTextColor(hue);let statClass='';let statStyle=`style="background-color: ${colorBackground}; color: ${colorText}; border-color: ${colorText};"`;if(amount.number>0){amount.number="+"+toFixedTrim(amount.number,4);statClass=' class="pos"';}else{amount.number=toFixedTrim(amount.number,4);if(amount.number<0){statClass=' class="neg"';}else{statClass=' class="oth"';}}
statText=`<div${statClass} ${statStyle}>${amount.number} ${stat}</div>`;}
amount.symbol.forEach((amt)=>{let hue=hashToHue(stat??amount.symbol);let colorBackground=statBackgroundColor(hue);let colorText=statTextColor(hue);let statClass='';let statStyle=`style="background-color: ${colorBackground}; color: ${colorText}; border-color: ${colorText};"`;if(amt.length>0){if(amt[0]=='+'){statClass=' class="pos"';}else if(amt[0]=='-'){statClass=' class="neg"';}
else{statClass=' class="oth"';}}
statText+=`<div${statClass} ${statStyle}>${amt} ${stat}</div>`;});return`${statText}`;});if(build.items.has('U1436')){let hue=hashToHue("Ach");let colorBackground=statBackgroundColor(hue);let colorText=statTextColor(hue);statEntries.push(`<div class="neg" style="background-color: ${colorBackground}; color: ${colorText}; border-color: ${colorText};">-MAX Ach</div>`);}
if(build.items.has('U0955')){let hue=hashToHue("Spd");let colorBackground=statBackgroundColor(hue);let colorText=statTextColor(hue);statEntries.push(`<div class=\"oth\" style="background-color: ${colorBackground}; color: ${colorText}; border-color: ${colorText};">Spd = 1</div>`);}
statListContainer.innerHTML=statEntries.join('');if(!statListContainer.innerHTML){statListContainer.innerHTML=EMPTY_HTML;}}
function parseNumber(x){if(!x){return{number:null,symbol:null};}
if(x=="INF"){return{number:Number("Infinity")};}
if(x=="-INF"){return{number:Number("-Infinity")};}
if(isNaN(Number(x))){return{symbol:x};}
return{number:Number(x)};}
function deselectItem(build,id){build.items.delete(id);if(itemData[id].childIds){let children=[...itemData[id].childIds];while(children.length>0){let child=children.pop();if(build.items.has(child)){build.items.delete(child);}
if(itemData[child].childIds){children.push(...itemData[child].childIds);}}}
updateItemFromBuildsPage(build.id,id);saveSelectedBuild(build);}
function getTooltipHTML(id){let item=itemData[id];let description=item.description.replaceAll('\n','<br>');if(id=="U1983"){description="Choose any of the following ailments to cure yourself of:";}
if(id=="U1813"){description="Coating your skin with paint allows you reflect certain types of damage with an effectiveness of 1% per mm of paint thickness. The type of damage depends on the color according to the rules below:";}
if(id=="U0990"){description="Order as many items off the following menu as you want, as many times as you want. Item prices are in points.";}
if(item.stats){description+=` <span class="stats">(${item.stats.map(x => x.join(' ')).join(', ')})</span>`;}
if(item.footnoteIds){description+=item.footnoteIds.map(x=>`<a class="sup" href="#f-${x}">[${x}]</a>`).join("");}
if(description){description=`<div class="tooltip-inner-description">${description}</div>`;}
return description;}
export function updateBuildUI(){updateUI();}
function rotateBits(num,bits,nsize){return(((num<<bits)&(-1<<bits))|(num>>(nsize-bits)&(~(1<<bits))))&(~(-1<<nsize));}
function HSVtoRGB(h,s,v){var r,g,b,i,f,p,q,t;if(arguments.length===1){s=h.s,v=h.v,h=h.h;}
i=Math.floor(h*6);f=h*6-i;p=v*(1-s);q=v*(1-f*s);t=v*(1-(1-f)*s);switch(i%6){case 0:r=v,g=t,b=p;break;case 1:r=q,g=v,b=p;break;case 2:r=p,g=v,b=t;break;case 3:r=p,g=q,b=v;break;case 4:r=t,g=p,b=v;break;case 5:r=v,g=p,b=q;break;}
return{r:Math.round(r*255),g:Math.round(g*255),b:Math.round(b*255)};}
function hashToHue(str){let hash=0;for(let i=0;i<str.length;i++){let c=str.charCodeAt(i);hash=(rotateBits(hash,13,24)+hash-c)&0xffffff;hash=(rotateBits(hash,5,24)-hash+c)&0xffffff;hash|=0;}
let hue=hash&0xff;return hue/255;}
function statBackgroundColor(hue){let rgb=HSVtoRGB(hue,0.5,0.8);let color=rgb.r.toString(16).padStart(2,"0")
+rgb.g.toString(16).padStart(2,"0")
+rgb.b.toString(16).padStart(2,"0");return"#"+color+"80";}
function statTextColor(hue){let rgb=HSVtoRGB(hue,0.5,0.2);let color=rgb.r.toString(16).padStart(2,"0")
+rgb.g.toString(16).padStart(2,"0")
+rgb.b.toString(16).padStart(2,"0");return"#"+color;}