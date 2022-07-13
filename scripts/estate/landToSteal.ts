import {
  getEmptyTile,
  printTileWithCoord,
  TileWithCoord,
} from '../../test/map/fixtures';

export const ownerToSteal = '0x7a9fe22691c811ea339d9b73150e6911a5343dca';
export const landToSteal = [
  '36765',
  '151020',
  '151428',
  '151021',
  '151429',
  '128990',
  '128584',
  '30675',
  '13554',
  '51501',
  '12336',
  '55185',
  '28260',
  '141289',
  '155983',
  '28300',
  '158457',
  '78492',
  '78494',
  '118482',
  '69936',
  '70752',
  '71568',
  '78504',
  '78935',
  '78122',
  '34891',
  '160178',
  '163106',
  '163110',
  '166374',
  '165560',
  '83568',
  '20750',
  '19546',
  '19139',
  '19547',
  '100587',
  '100588',
  '100589',
  '100997',
  '100996',
  '100995',
  '101403',
  '101404',
  '101405',
  '143520',
  '143521',
  '143522',
  '143930',
  '143929',
  '143928',
  '144336',
  '144337',
  '144338',
  '151794',
  '151795',
  '151796',
  '151797',
  '151798',
  '151799',
  '152207',
  '152206',
  '152205',
  '152204',
  '152203',
  '152202',
  '152610',
  '152611',
  '152612',
  '152613',
  '152614',
  '152615',
  '153023',
  '153022',
  '153021',
  '153020',
  '153019',
  '153018',
  '153426',
  '153427',
  '153428',
  '153429',
  '153430',
  '153431',
  '153839',
  '153838',
  '153837',
  '153836',
  '153835',
  '153834',
  '7380',
  '7381',
  '7382',
  '7383',
  '7384',
  '7385',
  '7793',
  '7792',
  '7791',
  '7790',
  '7789',
  '7788',
  '8196',
  '8197',
  '8198',
  '8199',
  '8200',
  '8201',
  '8609',
  '8608',
  '8607',
  '8606',
  '8605',
  '8604',
  '9012',
  '9013',
  '9014',
  '9015',
  '9016',
  '9017',
  '9425',
  '9424',
  '9423',
  '9422',
  '9421',
  '9420',
  '144486',
  '144487',
  '144488',
  '144489',
  '144490',
  '144491',
  '144899',
  '144898',
  '144897',
  '144896',
  '144895',
  '144894',
  '145302',
  '145303',
  '145304',
  '145305',
  '145306',
  '145307',
  '145715',
  '145714',
  '145713',
  '145712',
  '145711',
  '145710',
  '146118',
  '146119',
  '146120',
  '146121',
  '146122',
  '146123',
  '146531',
  '146530',
  '146529',
  '146528',
  '146527',
  '146526',
  '144744',
  '144745',
  '144746',
  '144747',
  '144748',
  '144749',
  '145157',
  '145156',
  '145155',
  '145154',
  '145153',
  '145152',
  '145560',
  '145561',
  '145562',
  '145563',
  '145564',
  '145565',
  '145973',
  '145972',
  '145971',
  '145970',
  '145969',
  '145968',
  '146376',
  '146377',
  '146378',
  '146379',
  '146380',
  '146381',
  '146789',
  '146788',
  '146787',
  '146786',
  '146785',
  '146784',
  '17508',
  '17509',
  '17510',
  '17511',
  '17512',
  '17513',
  '17921',
  '17920',
  '17919',
  '17918',
  '17917',
  '17916',
  '18324',
  '18325',
  '18326',
  '18327',
  '18328',
  '18329',
  '18737',
  '18736',
  '18735',
  '18734',
  '18733',
  '18732',
  '19140',
  '19141',
  '19142',
  '19143',
  '19144',
  '19145',
  '19553',
  '19552',
  '19551',
  '19550',
  '19549',
  '19548',
  '146904',
  '146905',
  '146906',
  '146907',
  '146908',
  '146909',
  '146910',
  '146911',
  '146912',
  '146913',
  '146914',
  '146915',
  '146916',
  '146917',
  '146918',
  '146919',
  '146920',
  '146921',
  '146922',
  '146923',
  '146924',
  '146925',
  '146926',
  '146927',
  '147335',
  '147334',
  '147333',
  '147332',
  '147331',
  '147330',
  '147329',
  '147328',
  '147327',
  '147326',
  '147325',
  '147324',
  '147323',
  '147322',
  '147321',
  '147320',
  '147319',
  '147318',
  '147317',
  '147316',
  '147315',
  '147314',
  '147313',
  '147312',
  '147720',
  '147721',
  '147722',
  '147723',
  '147724',
  '147725',
  '147726',
  '147727',
  '147728',
  '147729',
  '147730',
  '147731',
  '147732',
  '147733',
  '147734',
  '147735',
  '147736',
  '147737',
  '147738',
  '147739',
  '147740',
  '147741',
  '147742',
  '147743',
  '148151',
  '148150',
  '148149',
  '148148',
  '148147',
  '148146',
  '148145',
  '148144',
  '148143',
  '148142',
  '148141',
  '148140',
  '148139',
  '148138',
  '148137',
  '148136',
  '148135',
  '148134',
  '148133',
  '148132',
  '148131',
  '148130',
  '148129',
  '148128',
  '148536',
  '148537',
  '148538',
  '148539',
  '148540',
  '148541',
  '148542',
  '148543',
  '148544',
  '148545',
  '148546',
  '148547',
  '148548',
  '148549',
  '148550',
  '148551',
  '148552',
  '148553',
  '148554',
  '148555',
  '148556',
  '148557',
  '148558',
  '148559',
  '148967',
  '148966',
  '148965',
  '148964',
  '148963',
  '148962',
  '148961',
  '148960',
  '148959',
  '148958',
  '148957',
  '148956',
  '148955',
  '148954',
  '148953',
  '148952',
  '148951',
  '148950',
  '148949',
  '148948',
  '148947',
  '148946',
  '148945',
  '148944',
  '149352',
  '149353',
  '149354',
  '149355',
  '149356',
  '149357',
  '149358',
  '149359',
  '149360',
  '149361',
  '149362',
  '149363',
  '149364',
  '149365',
  '149366',
  '149367',
  '149368',
  '149369',
  '149370',
  '149371',
  '149372',
  '149373',
  '149374',
  '149375',
  '149783',
  '149782',
  '149781',
  '149780',
  '149779',
  '149778',
  '149777',
  '149776',
  '149775',
  '149774',
  '149773',
  '149772',
  '149771',
  '149770',
  '149769',
  '149768',
  '149767',
  '149766',
  '149765',
  '149764',
  '149763',
  '149762',
  '149761',
  '149760',
  '150168',
  '150169',
  '150170',
  '150171',
  '150172',
  '150173',
  '150174',
  '150175',
  '150176',
  '150177',
  '150178',
  '150179',
  '150180',
  '150181',
  '150182',
  '150183',
  '150184',
  '150185',
  '150186',
  '150187',
  '150188',
  '150189',
  '150190',
  '150191',
  '150599',
  '150598',
  '150597',
  '150596',
  '150595',
  '150594',
  '150593',
  '150592',
  '150591',
  '150590',
  '150589',
  '150588',
  '150587',
  '150586',
  '150585',
  '150584',
  '150583',
  '150582',
  '150581',
  '150580',
  '150579',
  '150578',
  '150577',
  '150576',
  '150984',
  '150985',
  '150986',
  '150987',
  '150988',
  '150989',
  '150990',
  '150991',
  '150992',
  '150993',
  '150994',
  '150995',
  '150996',
  '150997',
  '150998',
  '150999',
  '151000',
  '151001',
  '151002',
  '151003',
  '151004',
  '151005',
  '151006',
  '151007',
  '151415',
  '151414',
  '151413',
  '151412',
  '151411',
  '151410',
  '151409',
  '151408',
  '151407',
  '151406',
  '151405',
  '151404',
  '151403',
  '151402',
  '151401',
  '151400',
  '151399',
  '151398',
  '151397',
  '151396',
  '151395',
  '151394',
  '151393',
  '151392',
  '151800',
  '151801',
  '151802',
  '151803',
  '151804',
  '151805',
  '151806',
  '151807',
  '151808',
  '151809',
  '151810',
  '151811',
  '151812',
  '151813',
  '151814',
  '151815',
  '151816',
  '151817',
  '151818',
  '151819',
  '151820',
  '151821',
  '151822',
  '151823',
  '152231',
  '152230',
  '152229',
  '152228',
  '152227',
  '152226',
  '152225',
  '152224',
  '152223',
  '152222',
  '152221',
  '152220',
  '152219',
  '152218',
  '152217',
  '152216',
  '152215',
  '152214',
  '152213',
  '152212',
  '152211',
  '152210',
  '152209',
  '152208',
  '152616',
  '152617',
  '152618',
  '152619',
  '152620',
  '152621',
  '152622',
  '152623',
  '152624',
  '152625',
  '152626',
  '152627',
  '152628',
  '152629',
  '152630',
  '152631',
  '152632',
  '152633',
  '152634',
  '152635',
  '152636',
  '152637',
  '152638',
  '152639',
  '153047',
  '153046',
  '153045',
  '153044',
  '153043',
  '153042',
  '153041',
  '153040',
  '153039',
  '153038',
  '153037',
  '153036',
  '153035',
  '153034',
  '153033',
  '153032',
  '153031',
  '153030',
  '153029',
  '153028',
  '153027',
  '153026',
  '153025',
  '153024',
  '153432',
  '153433',
  '153434',
  '153435',
  '153436',
  '153437',
  '153438',
  '153439',
  '153440',
  '153441',
  '153442',
  '153443',
  '153444',
  '153445',
  '153446',
  '153447',
  '153448',
  '153449',
  '153450',
  '153451',
  '153452',
  '153453',
  '153454',
  '153455',
  '153863',
  '153862',
  '153861',
  '153860',
  '153859',
  '153858',
  '153857',
  '153856',
  '153855',
  '153854',
  '153853',
  '153852',
  '153851',
  '153850',
  '153849',
  '153848',
  '153847',
  '153846',
  '153845',
  '153844',
  '153843',
  '153842',
  '153841',
  '153840',
  '154248',
  '154249',
  '154250',
  '154251',
  '154252',
  '154253',
  '154254',
  '154255',
  '154256',
  '154257',
  '154258',
  '154259',
  '154260',
  '154261',
  '154262',
  '154263',
  '154264',
  '154265',
  '154266',
  '154267',
  '154268',
  '154269',
  '154270',
  '154271',
  '154679',
  '154678',
  '154677',
  '154676',
  '154675',
  '154674',
  '154673',
  '154672',
  '154671',
  '154670',
  '154669',
  '154668',
  '154667',
  '154666',
  '154665',
  '154664',
  '154663',
  '154662',
  '154661',
  '154660',
  '154659',
  '154658',
  '154657',
  '154656',
  '155064',
  '155065',
  '155066',
  '155067',
  '155068',
  '155069',
  '155070',
  '155071',
  '155072',
  '155073',
  '155074',
  '155075',
  '155076',
  '155077',
  '155078',
  '155079',
  '155080',
  '155081',
  '155082',
  '155083',
  '155084',
  '155085',
  '155086',
  '155087',
  '155495',
  '155494',
  '155493',
  '155492',
  '155491',
  '155490',
  '155489',
  '155488',
  '155487',
  '155486',
  '155485',
  '155484',
  '155483',
  '155482',
  '155481',
  '155480',
  '155479',
  '155478',
  '155477',
  '155476',
  '155475',
  '155474',
  '155473',
  '155472',
  '155880',
  '155881',
  '155882',
  '155883',
  '155884',
  '155885',
  '155886',
  '155887',
  '155888',
  '155889',
  '155890',
  '155891',
  '155892',
  '155893',
  '155894',
  '155895',
  '155896',
  '155897',
  '155898',
  '155899',
  '155900',
  '155901',
  '155902',
  '155903',
  '156311',
  '156310',
  '156309',
  '156308',
  '156307',
  '156306',
  '156305',
  '156304',
  '156303',
  '156302',
  '156301',
  '156300',
  '156299',
  '156298',
  '156297',
  '156296',
  '156295',
  '156294',
  '156293',
  '156292',
  '156291',
  '156290',
  '156289',
  '156288',
  '137376',
  '137377',
  '137378',
  '137379',
  '137380',
  '137381',
  '137382',
  '137383',
  '137384',
  '137385',
  '137386',
  '137387',
  '137388',
  '137389',
  '137390',
  '137391',
  '137392',
  '137393',
  '137394',
  '137395',
  '137396',
  '137397',
  '137398',
  '137399',
  '137807',
  '137806',
  '137805',
  '137804',
  '137803',
  '137802',
  '137801',
  '137800',
  '137799',
  '137798',
  '137797',
  '137796',
  '137795',
  '137794',
  '137793',
  '137792',
  '137791',
  '137790',
  '137789',
  '137788',
  '137787',
  '137786',
  '137785',
  '137784',
  '138192',
  '138193',
  '138194',
  '138195',
  '138196',
  '138197',
  '138198',
  '138199',
  '138200',
  '138201',
  '138202',
  '138203',
  '138204',
  '138205',
  '138206',
  '138207',
  '138208',
  '138209',
  '138210',
  '138211',
  '138212',
  '138213',
  '138214',
  '138215',
  '138623',
  '138622',
  '138621',
  '138620',
  '138619',
  '138618',
  '138617',
  '138616',
  '138615',
  '138614',
  '138613',
  '138612',
  '138611',
  '138610',
  '138609',
  '138608',
  '138607',
  '138606',
  '138605',
  '138604',
  '138603',
  '138602',
  '138601',
  '138600',
  '139008',
  '139009',
  '139010',
  '139011',
  '139012',
  '139013',
  '139014',
  '139015',
  '139016',
  '139017',
  '139018',
  '139019',
  '139020',
  '139021',
  '139022',
  '139023',
  '139024',
  '139025',
  '139026',
  '139027',
  '139028',
  '139029',
  '139030',
  '139031',
  '139439',
  '139438',
  '139437',
  '139436',
  '139435',
  '139434',
  '139433',
  '139432',
  '139431',
  '139430',
  '139429',
  '139428',
  '139427',
  '139426',
  '139425',
  '139424',
  '139423',
  '139422',
  '139421',
  '139420',
  '139419',
  '139418',
  '139417',
  '139416',
  '139824',
  '139825',
  '139826',
  '139827',
  '139828',
  '139829',
  '139830',
  '139831',
  '139832',
  '139833',
  '139834',
  '139835',
  '139836',
  '139837',
  '139838',
  '139839',
  '139840',
  '139841',
  '139842',
  '139843',
  '139844',
  '139845',
  '139846',
  '139847',
  '140255',
  '140254',
  '140253',
  '140252',
  '140251',
  '140250',
  '140249',
  '140248',
  '140247',
  '140246',
  '140245',
  '140244',
  '140243',
  '140242',
  '140241',
  '140240',
  '140239',
  '140238',
  '140237',
  '140236',
  '140235',
  '140234',
  '140233',
  '140232',
  '140640',
  '140641',
  '140642',
  '140643',
  '140644',
  '140645',
  '140646',
  '140647',
  '140648',
  '140649',
  '140650',
  '140651',
  '140652',
  '140653',
  '140654',
  '140655',
  '140656',
  '140657',
  '140658',
  '140659',
  '140660',
  '140661',
  '140662',
  '140663',
  '141071',
  '141070',
  '141069',
  '141068',
  '141067',
  '141066',
  '141065',
  '141064',
  '141063',
  '141062',
  '141061',
  '141060',
  '141059',
  '141058',
  '141057',
  '141056',
  '141055',
  '141054',
  '141053',
  '141052',
  '141051',
  '141050',
  '141049',
  '141048',
  '141456',
  '141457',
  '141458',
  '141459',
  '141460',
  '141461',
  '141462',
  '141463',
  '141464',
  '141465',
  '141466',
  '141467',
  '141468',
  '141469',
  '141470',
  '141471',
  '141472',
  '141473',
  '141474',
  '141475',
  '141476',
  '141477',
  '141478',
  '141479',
  '141887',
  '141886',
  '141885',
  '141884',
  '141883',
  '141882',
  '141881',
  '141880',
  '141879',
  '141878',
  '141877',
  '141876',
  '141875',
  '141874',
  '141873',
  '141872',
  '141871',
  '141870',
  '141869',
  '141868',
  '141867',
  '141866',
  '141865',
  '141864',
  '142272',
  '142273',
  '142274',
  '142275',
  '142276',
  '142277',
  '142278',
  '142279',
  '142280',
  '142281',
  '142282',
  '142283',
  '142284',
  '142285',
  '142286',
  '142287',
  '142288',
  '142289',
  '142290',
  '142291',
  '142292',
  '142293',
  '142294',
  '142295',
  '142703',
  '142702',
  '142701',
  '142700',
  '142699',
  '142698',
  '142697',
  '142696',
  '142695',
  '142694',
  '142693',
  '142692',
  '142691',
  '142690',
  '142689',
  '142688',
  '142687',
  '142686',
  '142685',
  '142684',
  '142683',
  '142682',
  '142681',
  '142680',
  '143088',
  '143089',
  '143090',
  '143091',
  '143092',
  '143093',
  '143094',
  '143095',
  '143096',
  '143097',
  '143098',
  '143099',
  '143100',
  '143101',
  '143102',
  '143103',
  '143104',
  '143105',
  '143106',
  '143107',
  '143108',
  '143109',
  '143110',
  '143111',
  '143519',
  '143518',
  '143517',
  '143516',
  '143515',
  '143514',
  '143513',
  '143512',
  '143511',
  '143510',
  '143509',
  '143508',
  '143507',
  '143506',
  '143505',
  '143504',
  '143503',
  '143502',
  '143501',
  '143500',
  '143499',
  '143498',
  '143497',
  '143496',
  '143904',
  '143905',
  '143906',
  '143907',
  '143908',
  '143909',
  '143910',
  '143911',
  '143912',
  '143913',
  '143914',
  '143915',
  '143916',
  '143917',
  '143918',
  '143919',
  '143920',
  '143921',
  '143922',
  '143923',
  '143924',
  '143925',
  '143926',
  '143927',
  '144335',
  '144334',
  '144333',
  '144332',
  '144331',
  '144330',
  '144329',
  '144328',
  '144327',
  '144326',
  '144325',
  '144324',
  '144323',
  '144322',
  '144321',
  '144320',
  '144319',
  '144318',
  '144317',
  '144316',
  '144315',
  '144314',
  '144313',
  '144312',
  '144720',
  '144721',
  '144722',
  '144723',
  '144724',
  '144725',
  '144726',
  '144727',
  '144728',
  '144729',
  '144730',
  '144731',
  '144732',
  '144733',
  '144734',
  '144735',
  '144736',
  '144737',
  '144738',
  '144739',
  '144740',
  '144741',
  '144742',
  '144743',
  '145151',
  '145150',
  '145149',
  '145148',
  '145147',
  '145146',
  '145145',
  '145144',
  '145143',
  '145142',
  '145141',
  '145140',
  '145139',
  '145138',
  '145137',
  '145136',
  '145135',
  '145134',
  '145133',
  '145132',
  '145131',
  '145130',
  '145129',
  '145128',
  '145536',
  '145537',
  '145538',
  '145539',
  '145540',
  '145541',
  '145542',
  '145543',
  '145544',
  '145545',
  '145546',
  '145547',
  '145548',
  '145549',
  '145550',
  '145551',
  '145552',
  '145553',
  '145554',
  '145555',
  '145556',
  '145557',
  '145558',
  '145559',
  '145967',
  '145966',
  '145965',
  '145964',
  '145963',
  '145962',
  '145961',
  '145960',
  '145959',
  '145958',
  '145957',
  '145956',
  '145955',
  '145954',
  '145953',
  '145952',
  '145951',
  '145950',
  '145949',
  '145948',
  '145947',
  '145946',
  '145945',
  '145944',
  '146352',
  '146353',
  '146354',
  '146355',
  '146356',
  '146357',
  '146358',
  '146359',
  '146360',
  '146361',
  '146362',
  '146363',
  '146364',
  '146365',
  '146366',
  '146367',
  '146368',
  '146369',
  '146370',
  '146371',
  '146372',
  '146373',
  '146374',
  '146375',
  '146783',
  '146782',
  '146781',
  '146780',
  '146779',
  '146778',
  '146777',
  '146776',
  '146775',
  '146774',
  '146773',
  '146772',
  '146771',
  '146770',
  '146769',
  '146768',
  '146767',
  '146766',
  '146765',
  '146764',
  '146763',
  '146762',
  '146761',
  '146760',
  '10176',
  '10177',
  '10178',
  '10179',
  '10180',
  '10181',
  '10182',
  '10183',
  '10184',
  '10185',
  '10186',
  '10187',
  '10188',
  '10189',
  '10190',
  '10191',
  '10192',
  '10193',
  '10194',
  '10195',
  '10196',
  '10197',
  '10198',
  '10199',
  '10607',
  '10606',
  '10605',
  '10604',
  '10603',
  '10602',
  '10601',
  '10600',
  '10599',
  '10598',
  '10597',
  '10596',
  '10595',
  '10594',
  '10593',
  '10592',
  '10591',
  '10590',
  '10589',
  '10588',
  '10587',
  '10586',
  '10585',
  '10584',
  '10992',
  '10993',
  '10994',
  '10995',
  '10996',
  '10997',
  '10998',
  '10999',
  '11000',
  '11001',
  '11002',
  '11003',
  '11004',
  '11005',
  '11006',
  '11007',
  '11008',
  '11009',
  '11010',
  '11011',
  '11012',
  '11013',
  '11014',
  '11015',
  '11423',
  '11422',
  '11421',
  '11420',
  '11419',
  '11418',
  '11417',
  '11416',
  '11415',
  '11414',
  '11413',
  '11412',
  '11411',
  '11410',
  '11409',
  '11408',
  '11407',
  '11406',
  '11405',
  '11404',
  '11403',
  '11402',
  '11401',
  '11400',
  '11808',
  '11809',
  '11810',
  '11811',
  '11812',
  '11813',
  '11814',
  '11815',
  '11816',
  '11817',
  '11818',
  '11819',
  '11820',
  '11821',
  '11822',
  '11823',
  '11824',
  '11825',
  '11826',
  '11827',
  '11828',
  '11829',
  '11830',
  '11831',
  '12239',
  '12238',
  '12237',
  '12236',
  '12235',
  '12234',
  '12233',
  '12232',
  '12231',
  '12230',
  '12229',
  '12228',
  '12227',
  '12226',
  '12225',
  '12224',
  '12223',
  '12222',
  '12221',
  '12220',
  '12219',
  '12218',
  '12217',
  '12216',
  '12624',
  '12625',
  '12626',
  '12627',
  '12628',
  '12629',
  '12630',
  '12631',
  '12632',
  '12633',
  '12634',
  '12635',
  '12636',
  '12637',
  '12638',
  '12639',
  '12640',
  '12641',
  '12642',
  '12643',
  '12644',
  '12645',
  '12646',
  '12647',
  '13055',
  '13054',
  '13053',
  '13052',
  '13051',
  '13050',
  '13049',
  '13048',
  '13047',
  '13046',
  '13045',
  '13044',
  '13043',
  '13042',
  '13041',
  '13040',
  '13039',
  '13038',
  '13037',
  '13036',
  '13035',
  '13034',
  '13033',
  '13032',
  '13440',
  '13441',
  '13442',
  '13443',
  '13444',
  '13445',
  '13446',
  '13447',
  '13448',
  '13449',
  '13450',
  '13451',
  '13452',
  '13453',
  '13454',
  '13455',
  '13456',
  '13457',
  '13458',
  '13459',
  '13460',
  '13461',
  '13462',
  '13463',
  '13871',
  '13870',
  '13869',
  '13868',
  '13867',
  '13866',
  '13865',
  '13864',
  '13863',
  '13862',
  '13861',
  '13860',
  '13859',
  '13858',
  '13857',
  '13856',
  '13855',
  '13854',
  '13853',
  '13852',
  '13851',
  '13850',
  '13849',
  '13848',
  '14256',
  '14257',
  '14258',
  '14259',
  '14260',
  '14261',
  '14262',
  '14263',
  '14264',
  '14265',
  '14266',
  '14267',
  '14268',
  '14269',
  '14270',
  '14271',
  '14272',
  '14273',
  '14274',
  '14275',
  '14276',
  '14277',
  '14278',
  '14279',
  '14687',
  '14686',
  '14685',
  '14684',
  '14683',
  '14682',
  '14681',
  '14680',
  '14679',
  '14678',
  '14677',
  '14676',
  '14675',
  '14674',
  '14673',
  '14672',
  '14671',
  '14670',
  '14669',
  '14668',
  '14667',
  '14666',
  '14665',
  '14664',
  '15072',
  '15073',
  '15074',
  '15075',
  '15076',
  '15077',
  '15078',
  '15079',
  '15080',
  '15081',
  '15082',
  '15083',
  '15084',
  '15085',
  '15086',
  '15087',
  '15088',
  '15089',
  '15090',
  '15091',
  '15092',
  '15093',
  '15094',
  '15095',
  '15503',
  '15502',
  '15501',
  '15500',
  '15499',
  '15498',
  '15497',
  '15496',
  '15495',
  '15494',
  '15493',
  '15492',
  '15491',
  '15490',
  '15489',
  '15488',
  '15487',
  '15486',
  '15485',
  '15484',
  '15483',
  '15482',
  '15481',
  '15480',
  '15888',
  '15889',
  '15890',
  '15891',
  '15892',
  '15893',
  '15894',
  '15895',
  '15896',
  '15897',
  '15898',
  '15899',
  '15900',
  '15901',
  '15902',
  '15903',
  '15904',
  '15905',
  '15906',
  '15907',
  '15908',
  '15909',
  '15910',
  '15911',
  '16319',
  '16318',
  '16317',
  '16316',
  '16315',
  '16314',
  '16313',
  '16312',
  '16311',
  '16310',
  '16309',
  '16308',
  '16307',
  '16306',
  '16305',
  '16304',
  '16303',
  '16302',
  '16301',
  '16300',
  '16299',
  '16298',
  '16297',
  '16296',
  '16704',
  '16705',
  '16706',
  '16707',
  '16708',
  '16709',
  '16710',
  '16711',
  '16712',
  '16713',
  '16714',
  '16715',
  '16716',
  '16717',
  '16718',
  '16719',
  '16720',
  '16721',
  '16722',
  '16723',
  '16724',
  '16725',
  '16726',
  '16727',
  '17135',
  '17134',
  '17133',
  '17132',
  '17131',
  '17130',
  '17129',
  '17128',
  '17127',
  '17126',
  '17125',
  '17124',
  '17123',
  '17122',
  '17121',
  '17120',
  '17119',
  '17118',
  '17117',
  '17116',
  '17115',
  '17114',
  '17113',
  '17112',
  '17520',
  '17521',
  '17522',
  '17523',
  '17524',
  '17525',
  '17526',
  '17527',
  '17528',
  '17529',
  '17530',
  '17531',
  '17532',
  '17533',
  '17534',
  '17535',
  '17536',
  '17537',
  '17538',
  '17539',
  '17540',
  '17541',
  '17542',
  '17543',
  '17951',
  '17950',
  '17949',
  '17948',
  '17947',
  '17946',
  '17945',
  '17944',
  '17943',
  '17942',
  '17941',
  '17940',
  '17939',
  '17938',
  '17937',
  '17936',
  '17935',
  '17934',
  '17933',
  '17932',
  '17931',
  '17930',
  '17929',
  '17928',
  '18336',
  '18337',
  '18338',
  '18339',
  '18340',
  '18341',
  '18342',
  '18343',
  '18344',
  '18345',
  '18346',
  '18347',
  '18348',
  '18349',
  '18350',
  '18351',
  '18352',
  '18353',
  '18354',
  '18355',
  '18356',
  '18357',
  '18358',
  '18359',
  '18767',
  '18766',
  '18765',
  '18764',
  '18763',
  '18762',
  '18761',
  '18760',
  '18759',
  '18758',
  '18757',
  '18756',
  '18755',
  '18754',
  '18753',
  '18752',
  '18751',
  '18750',
  '18749',
  '18748',
  '18747',
  '18746',
  '18745',
  '18744',
  '19152',
  '19153',
  '19154',
  '19155',
  '19156',
  '19157',
  '19158',
  '19159',
  '19160',
  '19161',
  '19162',
  '19163',
  '19164',
  '19165',
  '19166',
  '19167',
  '19168',
  '19169',
  '19170',
  '19171',
  '19172',
  '19173',
  '19174',
  '19175',
  '19583',
  '19582',
  '19581',
  '19580',
  '19579',
  '19578',
  '19577',
  '19576',
  '19575',
  '19574',
  '19573',
  '19572',
  '19571',
  '19570',
  '19569',
  '19568',
  '19567',
  '19566',
  '19565',
  '19564',
  '19563',
  '19562',
  '19561',
  '19560',
];

if (require.main === module) {
  const args = process.argv.slice(process.argv.indexOf(__filename) + 1);
  if (args.length == 3) {
    const size = parseInt(args[0]);
    const x = parseInt(args[1]);
    const y = parseInt(args[2]);
    console.log('size', size, 'x', x, 'y', y);
    console.log(
      'need tokenId',
      x + y * 408,
      '-',
      x + size - 1 + (y + size - 1) * 408
    );
    const ids: {[k: string]: boolean} = {};
    for (const land of landToSteal) {
      ids[land] = true;
    }
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const id = (x + i + (y + j) * 408).toString();
        if (!ids[id]) {
          console.log('missing', id, 'x', x + i, 'y', y + j);
        }
      }
    }
    process.exit();
  }

  const tiles: {[k: number]: TileWithCoord} = {};
  for (const land of landToSteal) {
    const l = parseInt(land);
    const x = l % 408;
    const y = Math.floor(l / 408);
    const tx = Math.floor(x / 24);
    const ty = Math.floor(y / 24);
    const tileId = tx + ty * 17;
    if (!tiles[tileId]) {
      tiles[tileId] = {x: tx, y: ty, tile: getEmptyTile()};
    }
    tiles[tileId].tile[y % 24][x % 24] = true;
  }
  for (const t of Object.keys(tiles)) {
    printTileWithCoord(tiles[parseInt(t)]);
  }
}
