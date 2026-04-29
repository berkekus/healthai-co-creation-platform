export const COUNTRIES: string[] = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda',
  'Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain',
  'Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan',
  'Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria',
  'Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada',
  'Central African Republic','Chad','Chile','China','Colombia','Comoros',
  'Congo (DRC)','Congo (Republic)','Costa Rica','Croatia','Cuba','Cyprus',
  'Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic',
  'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia',
  'Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia',
  'Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau',
  'Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran',
  'Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan',
  'Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho',
  'Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar',
  'Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania',
  'Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro',
  'Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands',
  'New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia',
  'Norway','Oman','Pakistan','Palau','Panama','Papua New Guinea','Paraguay',
  'Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda',
  'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines',
  'Samoa','San Marino','Saudi Arabia','Senegal','Serbia','Seychelles',
  'Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia',
  'South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan',
  'Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania',
  'Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia',
  'Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Venezuela',
  'Vietnam','Yemen','Zambia','Zimbabwe',
]

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'Turkey': [
    'Istanbul','Ankara','Izmir','Bursa','Adana','Gaziantep','Konya','Antalya',
    'Kayseri','Mersin','Eskişehir','Diyarbakır','Samsun','Denizli','Şanlıurfa',
    'Adapazarı','Malatya','Kahramanmaraş','Erzurum','Van','Trabzon','Balıkesir',
    'Batman','Kocaeli','Manisa','Elazığ','Sivas','Tokat','Çorum','Ordu',
    'Antakya','Muğla','Edirne','Tekirdağ','Bodrum','Fethiye','Alanya','Side',
  ],
  'United States': [
    'New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia',
    'San Antonio','San Diego','Dallas','San Jose','Austin','Jacksonville',
    'San Francisco','Columbus','Charlotte','Indianapolis','Seattle','Denver',
    'Washington DC','Nashville','Boston','El Paso','Portland','Las Vegas',
    'Memphis','Louisville','Baltimore','Milwaukee','Albuquerque','Tucson',
    'Fresno','Sacramento','Mesa','Kansas City','Atlanta','Omaha','Colorado Springs',
    'Raleigh','Virginia Beach','Long Beach','Minneapolis','Tampa','New Orleans',
    'Arlington','Bakersfield','Honolulu','Anaheim','Aurora','Santa Ana',
    'Corpus Christi','Riverside','St. Louis','Pittsburgh','Cincinnati',
    'Detroit','Cleveland','Salt Lake City','Miami','Orlando','Buffalo',
  ],
  'United Kingdom': [
    'London','Manchester','Birmingham','Leeds','Glasgow','Sheffield','Bradford',
    'Liverpool','Edinburgh','Bristol','Cardiff','Leicester','Coventry','Nottingham',
    'Newcastle upon Tyne','Belfast','Southampton','Brighton','Plymouth','Derby',
    'Wolverhampton','Stoke-on-Trent','Swansea','Oxford','Cambridge','York',
    'Aberdeen','Dundee','Inverness','Norwich','Reading','Exeter',
  ],
  'Germany': [
    'Berlin','Hamburg','Munich','Cologne','Frankfurt','Stuttgart','Düsseldorf',
    'Leipzig','Dortmund','Essen','Bremen','Dresden','Hanover','Nuremberg',
    'Duisburg','Bochum','Wuppertal','Bielefeld','Bonn','Münster','Karlsruhe',
    'Mannheim','Augsburg','Wiesbaden','Gelsenkirchen','Mönchengladbach',
    'Braunschweig','Kiel','Chemnitz','Aachen','Halle','Magdeburg','Freiburg',
    'Krefeld','Lübeck','Mainz','Erfurt','Rostock','Kassel','Heidelberg',
  ],
  'France': [
    'Paris','Marseille','Lyon','Toulouse','Nice','Nantes','Montpellier',
    'Strasbourg','Bordeaux','Lille','Rennes','Reims','Le Havre','Saint-Étienne',
    'Toulon','Grenoble','Dijon','Angers','Nîmes','Villeurbanne','Le Mans',
    'Clermont-Ferrand','Aix-en-Provence','Brest','Tours','Amiens','Limoges',
    'Perpignan','Metz','Besançon','Orléans','Mulhouse','Caen','Nancy',
  ],
  'Italy': [
    'Rome','Milan','Naples','Turin','Palermo','Genoa','Bologna','Florence',
    'Bari','Catania','Venice','Verona','Messina','Padua','Trieste','Taranto',
    'Brescia','Prato','Parma','Modena','Reggio Calabria','Reggio Emilia',
    'Perugia','Livorno','Ravenna','Cagliari','Foggia','Rimini','Salerno',
  ],
  'Spain': [
    'Madrid','Barcelona','Valencia','Seville','Zaragoza','Málaga','Murcia',
    'Palma','Las Palmas','Bilbao','Alicante','Córdoba','Valladolid','Vigo',
    'Gijón','Granada','Elche','Oviedo','Badalona','Cartagena','Terrassa',
    'Jerez de la Frontera','Sabadell','Santa Cruz de Tenerife','Pamplona',
  ],
  'Netherlands': [
    'Amsterdam','Rotterdam','The Hague','Utrecht','Eindhoven','Groningen',
    'Tilburg','Almere','Breda','Nijmegen','Enschede','Apeldoorn','Haarlem',
    'Arnhem','Zaanstad','Amersfoort','Den Bosch','Maastricht','Leiden',
  ],
  'Belgium': [
    'Brussels','Antwerp','Ghent','Charleroi','Liège','Bruges','Namur',
    'Leuven','Mons','Aalst','Mechelen','La Louvière','Hasselt','Kortrijk',
  ],
  'Switzerland': [
    'Zurich','Geneva','Basel','Bern','Lausanne','Winterthur','Lucerne',
    'St. Gallen','Lugano','Biel/Bienne','Thun','Köniz','La Chaux-de-Fonds',
  ],
  'Austria': [
    'Vienna','Graz','Linz','Salzburg','Innsbruck','Klagenfurt','Villach',
    'Wels','Sankt Pölten','Dornbirn','Steyr','Feldkirch','Bregenz',
  ],
  'Sweden': [
    'Stockholm','Gothenburg','Malmö','Uppsala','Västerås','Örebro','Linköping',
    'Helsingborg','Jönköping','Norrköping','Lund','Umeå','Gävle','Borås',
  ],
  'Norway': [
    'Oslo','Bergen','Trondheim','Stavanger','Drammen','Fredrikstad','Kristiansand',
    'Sandnes','Tromsø','Sarpsborg','Skien','Ålesund','Sandefjord','Haugesund',
  ],
  'Denmark': [
    'Copenhagen','Aarhus','Odense','Aalborg','Esbjerg','Randers','Kolding',
    'Horsens','Vejle','Roskilde','Helsingør','Herning','Silkeborg','Næstved',
  ],
  'Finland': [
    'Helsinki','Espoo','Tampere','Vantaa','Oulu','Turku','Jyväskylä',
    'Lahti','Kuopio','Pori','Kouvola','Joensuu','Lappeenranta','Hämeenlinna',
  ],
  'Poland': [
    'Warsaw','Kraków','Łódź','Wrocław','Poznań','Gdańsk','Szczecin',
    'Bydgoszcz','Lublin','Białystok','Katowice','Gdynia','Częstochowa',
    'Radom','Sosnowiec','Toruń','Kielce','Gliwice','Zabrze','Bytom',
  ],
  'Czech Republic': [
    'Prague','Brno','Ostrava','Plzeň','Liberec','Olomouc','Ústí nad Labem',
    'České Budějovice','Hradec Králové','Pardubice','Zlín','Havířov',
  ],
  'Hungary': [
    'Budapest','Debrecen','Miskolc','Szeged','Pécs','Győr','Nyíregyháza',
    'Kecskemét','Székesfehérvár','Szombathely','Szolnok','Érd',
  ],
  'Romania': [
    'Bucharest','Cluj-Napoca','Timișoara','Iași','Constanța','Craiova',
    'Galați','Brașov','Ploiești','Oradea','Brăila','Bacău','Arad','Pitești',
  ],
  'Greece': [
    'Athens','Thessaloniki','Patras','Heraklion','Larissa','Volos',
    'Ioannina','Chania','Chalcis','Agrinio','Katerini','Trikala',
  ],
  'Portugal': [
    'Lisbon','Porto','Amadora','Braga','Setúbal','Coimbra','Funchal',
    'Almada','Agualva-Cacém','Aveiro','Viseu','Guimarães','Évora',
  ],
  'Russia': [
    'Moscow','Saint Petersburg','Novosibirsk','Yekaterinburg','Nizhny Novgorod',
    'Kazan','Chelyabinsk','Omsk','Samara','Ufa','Rostov-on-Don','Krasnoyarsk',
    'Voronezh','Perm','Volgograd','Saratov','Krasnodar','Tolyatti','Barnaul',
  ],
  'Ukraine': [
    'Kyiv','Kharkiv','Dnipro','Odessa','Donetsk','Zaporizhzhia','Lviv',
    'Kryvyi Rih','Mykolaiv','Mariupol','Luhansk','Vinnytsia','Makiivka',
  ],
  'Canada': [
    'Toronto','Montreal','Vancouver','Calgary','Edmonton','Ottawa','Winnipeg',
    'Quebec City','Hamilton','Kitchener','London','Victoria','Halifax',
    'Oshawa','Windsor','Saskatoon','Regina','St. John\'s','Kelowna','Abbotsford',
  ],
  'Australia': [
    'Sydney','Melbourne','Brisbane','Perth','Adelaide','Gold Coast','Canberra',
    'Newcastle','Wollongong','Logan City','Geelong','Hobart','Townsville',
    'Cairns','Darwin','Toowoomba','Ballarat','Bendigo','Launceston',
  ],
  'New Zealand': [
    'Auckland','Wellington','Christchurch','Hamilton','Tauranga','Napier-Hastings',
    'Dunedin','Palmerston North','Nelson','Rotorua','Whangarei','New Plymouth',
  ],
  'Japan': [
    'Tokyo','Yokohama','Osaka','Nagoya','Sapporo','Fukuoka','Kobe','Kyoto',
    'Kawasaki','Saitama','Hiroshima','Sendai','Kitakyushu','Chiba','Sakai',
    'Niigata','Hamamatsu','Kumamoto','Sagamihara','Shizuoka','Okayama',
  ],
  'China': [
    'Shanghai','Beijing','Guangzhou','Shenzhen','Chongqing','Tianjin',
    'Wuhan','Chengdu','Xi\'an','Nanjing','Hangzhou','Shenyang','Harbin',
    'Qingdao','Jinan','Zhengzhou','Changsha','Kunming','Dalian','Fuzhou',
    'Wenzhou','Xiamen','Hefei','Nanchang','Guiyang','Lanzhou','Taiyuan',
  ],
  'South Korea': [
    'Seoul','Busan','Incheon','Daegu','Daejeon','Gwangju','Suwon',
    'Ulsan','Changwon','Seongnam','Goyang','Yongin','Bucheon','Cheongju',
  ],
  'India': [
    'Mumbai','Delhi','Bangalore','Hyderabad','Ahmedabad','Chennai','Kolkata',
    'Surat','Pune','Jaipur','Lucknow','Kanpur','Nagpur','Indore','Thane',
    'Bhopal','Visakhapatnam','Patna','Vadodara','Ghaziabad','Ludhiana',
    'Agra','Nashik','Faridabad','Meerut','Rajkot','Varanasi','Srinagar',
    'Aurangabad','Dhanbad','Amritsar','Allahabad','Ranchi','Coimbatore',
  ],
  'Brazil': [
    'São Paulo','Rio de Janeiro','Brasília','Salvador','Fortaleza','Belo Horizonte',
    'Manaus','Curitiba','Recife','Goiânia','Porto Alegre','Belém','Guarulhos',
    'Campinas','São Luís','Maceió','Natal','Teresina','Campo Grande','João Pessoa',
    'Osasco','Santo André','Florianópolis','Ribeirão Preto','Sorocaba',
  ],
  'Argentina': [
    'Buenos Aires','Córdoba','Rosario','Mendoza','Tucumán','La Plata',
    'Mar del Plata','Salta','Santa Fe','San Juan','Resistencia','Neuquén',
    'Santiago del Estero','Corrientes','Posadas','San Salvador de Jujuy',
  ],
  'Mexico': [
    'Mexico City','Guadalajara','Monterrey','Puebla','Toluca','Tijuana',
    'Ciudad Juárez','León','Zapopan','Nezahualcóyotl','Chihuahua','Naucalpan',
    'Mérida','San Luis Potosí','Aguascalientes','Culiacán','Acapulco',
    'Hermosillo','Saltillo','Morelia','Veracruz','Cancún','Querétaro',
  ],
  'Colombia': [
    'Bogotá','Medellín','Cali','Barranquilla','Cartagena','Cúcuta',
    'Bucaramanga','Pereira','Santa Marta','Ibagué','Manizales','Bello',
  ],
  'Chile': [
    'Santiago','Valparaíso','Concepción','La Serena','Antofagasta','Viña del Mar',
    'Temuco','Rancagua','Arica','Talca','Iquique','Puerto Montt',
  ],
  'Peru': [
    'Lima','Arequipa','Trujillo','Chiclayo','Piura','Iquitos','Cusco',
    'Huancayo','Tacna','Ica','Juliaca','Pucallpa',
  ],
  'Venezuela': [
    'Caracas','Maracaibo','Valencia','Barquisimeto','Maracay','Ciudad Guayana',
    'Barcelona','Maturín','Petare','Turmero','Barinas','Mérida',
  ],
  'South Africa': [
    'Johannesburg','Cape Town','Durban','Pretoria','Port Elizabeth','Bloemfontein',
    'East London','Nelspruit','Kimberley','Polokwane','Rustenburg','Pietermaritzburg',
  ],
  'Nigeria': [
    'Lagos','Kano','Ibadan','Abuja','Port Harcourt','Benin City','Maiduguri',
    'Zaria','Aba','Jos','Ilorin','Oyo','Enugu','Abeokuta','Kaduna',
  ],
  'Kenya': [
    'Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Ruiru','Kikuyu',
    'Thika','Malindi','Kitui','Machakos','Meru',
  ],
  'Ethiopia': [
    'Addis Ababa','Dire Dawa','Mekelle','Gondar','Hawassa','Bahir Dar',
    'Dessie','Jimma','Jijiga','Shashamane','Bishoftu',
  ],
  'Egypt': [
    'Cairo','Alexandria','Giza','Shubra El Kheima','Port Said','Suez',
    'Luxor','Mansoura','El Mahalla El Kubra','Tanta','Asyut','Ismailia',
    'Fayyum','Zagazig','Aswan','Damietta','Damanhur','Minya','Hurghada',
  ],
  'Morocco': [
    'Casablanca','Rabat','Fes','Marrakesh','Agadir','Tangier','Meknès',
    'Oujda','Kenitra','Tetouan','Safi','El Jadida','Khouribga',
  ],
  'Saudi Arabia': [
    'Riyadh','Jeddah','Mecca','Medina','Dammam','Taif','Tabuk','Qatif',
    'Khobar','Abha','Al Jubail','Al Hufuf','Najran','Yanbu',
  ],
  'United Arab Emirates': [
    'Dubai','Abu Dhabi','Sharjah','Al Ain','Ajman','Ras Al Khaimah',
    'Fujairah','Umm Al Quwain',
  ],
  'Iran': [
    'Tehran','Mashhad','Isfahan','Karaj','Tabriz','Shiraz','Ahvaz',
    'Qom','Kermanshah','Urmia','Rasht','Zahedan','Hamadan','Kerman',
  ],
  'Pakistan': [
    'Karachi','Lahore','Faisalabad','Rawalpindi','Gujranwala','Peshawar',
    'Multan','Hyderabad','Islamabad','Quetta','Bahawalpur','Sargodha',
  ],
  'Bangladesh': [
    'Dhaka','Chittagong','Khulna','Rajshahi','Sylhet','Comilla',
    'Rangpur','Mymensingh','Narayanganj','Gazipur',
  ],
  'Indonesia': [
    'Jakarta','Surabaya','Bandung','Medan','Bekasi','Tangerang','Depok',
    'Semarang','Palembang','Makassar','South Tangerang','Batam',
    'Bogor','Pekanbaru','Bandar Lampung','Malang','Padang','Denpasar',
  ],
  'Malaysia': [
    'Kuala Lumpur','George Town','Ipoh','Shah Alam','Petaling Jaya',
    'Johor Bahru','Kota Kinabalu','Kuching','Kuantan','Melaka','Seremban',
  ],
  'Philippines': [
    'Manila','Quezon City','Davao','Caloocan','Cebu City','Zamboanga',
    'Antipolo','Taguig','Pasig','Cagayan de Oro','Makati','Valenzuela',
  ],
  'Thailand': [
    'Bangkok','Nonthaburi','Nakhon Ratchasima','Chiang Mai','Hat Yai',
    'Udon Thani','Pak Kret','Surat Thani','Pattaya','Khon Kaen','Phuket',
  ],
  'Vietnam': [
    'Ho Chi Minh City','Hanoi','Da Nang','Hai Phong','Can Tho',
    'Bien Hoa','Hue','Nha Trang','Da Lat','Vung Tau','Buon Ma Thuot',
  ],
  'Singapore': ['Singapore'],
  'Taiwan': [
    'Taipei','New Taipei','Kaohsiung','Taichung','Tainan','Hsinchu',
    'Keelung','Taoyuan','Zhongli','Changhua',
  ],
  'Israel': [
    'Jerusalem','Tel Aviv','Haifa','Rishon LeZion','Petah Tikva',
    'Ashdod','Netanya','Beer Sheva','Holon','Bnei Brak','Ramat Gan',
  ],
  'Kazakhstan': [
    'Almaty','Nur-Sultan','Shimkent','Karaganda','Aktobe','Taraz',
    'Pavlodar','Ust-Kamenogorsk','Semey','Atyrau',
  ],
  'Uzbekistan': [
    'Tashkent','Samarkand','Namangan','Andijan','Nukus','Bukhara',
    'Qarshi','Fergana','Jizzakh','Margilan',
  ],
  'Ghana': [
    'Accra','Kumasi','Tamale','Takoradi','Cape Coast','Obuasi',
    'Tema','Sunyani','Koforidua','Ho',
  ],
  'Senegal': [
    'Dakar','Thiès','Touba','Kaolack','Ziguinchor','Saint-Louis',
    'Mbour','Rufisque','Diourbel',
  ],
  'Tanzania': [
    'Dar es Salaam','Mwanza','Arusha','Dodoma','Mbeya','Morogoro',
    'Tanga','Zanzibar City','Kigoma',
  ],
  'Uganda': [
    'Kampala','Gulu','Lira','Mbarara','Jinja','Mubende','Mbale',
  ],
  'Cameroon': [
    'Douala','Yaoundé','Bamenda','Bafoussam','Garoua','Maroua',
  ],
  'Ivory Coast': [
    'Abidjan','Bouaké','Daloa','Yamoussoukro','San-Pédro','Korhogo',
  ],
  'Algeria': [
    'Algiers','Oran','Constantine','Annaba','Blida','Batna',
    'Djelfa','Sétif','Sidi Bel Abbès','Biskra',
  ],
  'Tunisia': [
    'Tunis','Sfax','Sousse','Kairouan','Bizerte','Gabès','Ariana',
    'Gafsa','El Aghir','La Marsa',
  ],
  'Iraq': [
    'Baghdad','Basra','Mosul','Erbil','Najaf','Karbala','Kirkuk',
    'Sulaymaniyah','Fallujah','Ramadi',
  ],
  'Jordan': [
    'Amman','Zarqa','Irbid','Russeifa','Aqaba','Salt','Madaba',
  ],
  'Lebanon': [
    'Beirut','Tripoli','Sidon','Tyre','Jounieh','Zahlé','Baalbek',
  ],
  'Qatar': ['Doha','Al Rayyan','Al Wakrah','Al Khor','Dukhan'],
  'Kuwait': ['Kuwait City','Al Ahmadi','Hawalli','Salmiya','Farwaniya'],
  'Oman': [
    'Muscat','Seeb','Salalah','Bawshar','Sohar','As Suwayq','Nizwa',
  ],
  'Sri Lanka': [
    'Colombo','Dehiwala','Mount Lavinia','Sri Jayawardenepura Kotte',
    'Kandy','Negombo','Jaffna','Pita Kotte','Galle','Trincomalee',
  ],
  'Nepal': [
    'Kathmandu','Pokhara','Lalitpur','Bharatpur','Birganj','Biratnagar',
    'Dharan','Butwal','Siddharthanagar',
  ],
  'Myanmar': [
    'Yangon','Mandalay','Naypyidaw','Mawlamyine','Bago','Pathein',
    'Monywa','Sagaing','Taunggyi',
  ],
  'Cambodia': [
    'Phnom Penh','Siem Reap','Battambang','Sihanoukville','Poipet','Kampong Cham',
  ],
  'Serbia': [
    'Belgrade','Novi Sad','Niš','Kragujevac','Subotica','Leskovac','Zrenjanin',
  ],
  'Croatia': [
    'Zagreb','Split','Rijeka','Osijek','Zadar','Slavonski Brod','Pula',
  ],
  'Slovakia': [
    'Bratislava','Košice','Prešov','Žilina','Nitra','Banská Bystrica',
  ],
  'Bulgaria': [
    'Sofia','Plovdiv','Varna','Burgas','Ruse','Stara Zagora','Pleven',
  ],
  'Ireland': [
    'Dublin','Cork','Limerick','Galway','Waterford','Drogheda','Dundalk',
    'Swords','Bray','Navan',
  ],
  'Iceland': ['Reykjavik','Kópavogur','Hafnarfjörður','Akureyri'],
  'Cyprus': ['Nicosia','Limassol','Larnaca','Famagusta','Paphos'],
  'Lithuania': ['Vilnius','Kaunas','Klaipėda','Šiauliai','Panevėžys'],
  'Latvia': ['Riga','Daugavpils','Jēkabpils','Jelgava','Jūrmala','Rēzekne'],
  'Estonia': ['Tallinn','Tartu','Narva','Pärnu','Kohtla-Järve'],
  'Slovenia': ['Ljubljana','Maribor','Celje','Kranj','Koper'],
  'North Macedonia': ['Skopje','Bitola','Kumanovo','Tetovo','Ohrid'],
  'Bosnia and Herzegovina': ['Sarajevo','Banja Luka','Tuzla','Zenica','Mostar'],
  'Albania': ['Tirana','Durrës','Vlorë','Elbasan','Shkodër'],
  'Moldova': ['Chișinău','Tiraspol','Bălți','Bender','Rîbnița'],
  'Georgia': ['Tbilisi','Batumi','Kutaisi','Rustavi','Zugdidi'],
  'Armenia': ['Yerevan','Gyumri','Vanadzor','Vagharshapat','Hrazdan'],
  'Azerbaijan': ['Baku','Ganja','Sumqayıt','Mingəçevir','Nakhchivan'],
  'Belarus': ['Minsk','Gomel','Mogilev','Vitebsk','Grodno','Brest'],
}

export function getCitiesForCountry(country: string): string[] {
  if (!country) return getAllCities()
  return CITIES_BY_COUNTRY[country] ?? []
}

function getAllCities(): string[] {
  const seen = new Set<string>()
  const all: string[] = []
  for (const cities of Object.values(CITIES_BY_COUNTRY)) {
    for (const city of cities) {
      if (!seen.has(city)) { seen.add(city); all.push(city) }
    }
  }
  return all.sort()
}

// Flat sorted list (for backward compat)
export const CITIES: string[] = getAllCities()
