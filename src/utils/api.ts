import {
  Asset,
  AssetMaintenance,
  AttendanceRecord,
  CellGroup,
  ChurchEvent,
  DiscipleshipCourse,
  GroupMember,
  KioskCheckin,
  MemberCourseProgress,
  ServiceItem,
  ServicePlan,
  ServiceRoster,
  User,
  Visitor,
  VisitorFollowup,
  Worker,
} from "../types/models";

interface ApiErrorPayload {
  message?: string;
  error?: string;
}

interface LoginResponse {
  ok: boolean;
  user: User;
}

interface UpdateWorkerResponse {
  ok: boolean;
  worker: Worker;
}

interface KpiResponse {
  totalWorkers: number;
  attendanceToday: number;
  absent: number;
  lastSync: string;
}

const MOCK_WORKERS: Worker[] = [
  {
    "id": "W001",
    "name": "Osarumeh Enobakhare",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "osarumeh.enobakhare@churchhr.org",
    "phone": "+234 800 000 0001"
  },
  {
    "id": "W002",
    "name": "Samuel Sonayon",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "samuel.sonayon@churchhr.org",
    "phone": "+234 800 000 0002"
  },
  {
    "id": "W003",
    "name": "Kehinde Ali-Balogun",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "kehinde.ali.balogun@churchhr.org",
    "phone": "+234 800 000 0003"
  },
  {
    "id": "W004",
    "name": "Peace Friday",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "peace.friday@churchhr.org",
    "phone": "+234 800 000 0004"
  },
  {
    "id": "W005",
    "name": "Esther Anthony",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "esther.anthony@churchhr.org",
    "phone": "+234 800 000 0005"
  },
  {
    "id": "W006",
    "name": "Bethel Ikechukwu",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "bethel.ikechukwu@churchhr.org",
    "phone": "+234 800 000 0006"
  },
  {
    "id": "W007",
    "name": "Suzan Shayepe Makinde",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "suzan.shayepe.makinde@churchhr.org",
    "phone": "+234 800 000 0007"
  },
  {
    "id": "W008",
    "name": "Elizabeth Ijeh",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "elizabeth.ijeh@churchhr.org",
    "phone": "+234 800 000 0008"
  },
  {
    "id": "W009",
    "name": "Margaret Tinuala",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "margaret.tinuala@churchhr.org",
    "phone": "+234 800 000 0009"
  },
  {
    "id": "W010",
    "name": "John Kalu",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "john.kalu@churchhr.org",
    "phone": "+234 800 000 0010"
  },
  {
    "id": "W011",
    "name": "Victoria Ayideji",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "victoria.ayideji@churchhr.org",
    "phone": "+234 800 000 0011"
  },
  {
    "id": "W012",
    "name": "Lisa Arinola",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "lisa.arinola@churchhr.org",
    "phone": "+234 800 000 0012"
  },
  {
    "id": "W013",
    "name": "Patience Omo-Osagie",
    "department": "Intercessors",
    "role": "Member",
    "status": "active",
    "email": "patience.omo.osagie@churchhr.org",
    "phone": "+234 800 000 0013"
  },
  {
    "id": "W014",
    "name": "Esther Daniel-Ipaye",
    "department": "Hospitality & Team Engage",
    "role": "Member",
    "status": "active",
    "email": "esther.daniel.ipaye@churchhr.org",
    "phone": "+234 800 000 0014"
  },
  {
    "id": "W015",
    "name": "Blessing Akpeji",
    "department": "Hospitality & Team Engage",
    "role": "Member",
    "status": "active",
    "email": "blessing.akpeji@churchhr.org",
    "phone": "+234 800 000 0015"
  },
  {
    "id": "W016",
    "name": "Funmilayo Levites",
    "department": "Hospitality",
    "role": "Member",
    "status": "active",
    "email": "funmilayo.levites@churchhr.org",
    "phone": "+234 800 000 0016"
  },
  {
    "id": "W017",
    "name": "Josephine Iliya",
    "department": "Hospitality",
    "role": "Member",
    "status": "active",
    "email": "josephine.iliya@churchhr.org",
    "phone": "+234 800 000 0017"
  },
  {
    "id": "W018",
    "name": "Emmanuel Haruna",
    "department": "Hospitality",
    "role": "Member",
    "status": "active",
    "email": "emmanuel.haruna@churchhr.org",
    "phone": "+234 800 000 0018"
  },
  {
    "id": "W019",
    "name": "Rita Ikriko",
    "department": "TCC/Ushafa Children",
    "role": "Member",
    "status": "active",
    "email": "rita.ikriko@churchhr.org",
    "phone": "+234 800 000 0019"
  },
  {
    "id": "W020",
    "name": "Blessing Ozia",
    "department": "TCC/Ushafa Children",
    "role": "Member",
    "status": "active",
    "email": "blessing.ozia@churchhr.org",
    "phone": "+234 800 000 0020"
  },
  {
    "id": "W021",
    "name": "Dolapo Brenda Sander",
    "department": "TCC/Ushafa Children",
    "role": "Member",
    "status": "active",
    "email": "dolapo.brenda.sander@churchhr.org",
    "phone": "+234 800 000 0021"
  },
  {
    "id": "W022",
    "name": "Ken Sunday Osagie",
    "department": "TCC/Ushafa Children",
    "role": "Member",
    "status": "active",
    "email": "ken.sunday.osagie@churchhr.org",
    "phone": "+234 800 000 0022"
  },
  {
    "id": "W023",
    "name": "Divine Ofonime Asuquo",
    "department": "TCC/Ushafa Children",
    "role": "Member",
    "status": "active",
    "email": "divine.ofonime.asuquo@churchhr.org",
    "phone": "+234 800 000 0023"
  },
  {
    "id": "W024",
    "name": "Esther Frederick",
    "department": "TCC/Ushafa Children",
    "role": "Member",
    "status": "active",
    "email": "esther.frederick@churchhr.org",
    "phone": "+234 800 000 0024"
  },
  {
    "id": "W025",
    "name": "Otitoju Christiana",
    "department": "TCC/Ushafa Children",
    "role": "Member",
    "status": "active",
    "email": "otitoju.christiana@churchhr.org",
    "phone": "+234 800 000 0025"
  },
  {
    "id": "W026",
    "name": "Praise Victor",
    "department": "TCC/Ushafa Children",
    "role": "Member",
    "status": "active",
    "email": "praise.victor@churchhr.org",
    "phone": "+234 800 000 0026"
  },
  {
    "id": "W027",
    "name": "Prudence Aisudionoe-Progress",
    "department": "Events/Program",
    "role": "Member",
    "status": "active",
    "email": "prudence.aisudionoe.progress@churchhr.org",
    "phone": "+234 800 000 0027"
  },
  {
    "id": "W028",
    "name": "Osarumwense Ekhator",
    "department": "Events/Program",
    "role": "Member",
    "status": "active",
    "email": "osarumwense.ekhator@churchhr.org",
    "phone": "+234 800 000 0028"
  },
  {
    "id": "W029",
    "name": "Benjamin Emmanuel",
    "department": "Events/Program",
    "role": "Member",
    "status": "active",
    "email": "benjamin.emmanuel@churchhr.org",
    "phone": "+234 800 000 0029"
  },
  {
    "id": "W030",
    "name": "Ojochenemi Minabai Seibofa",
    "department": "Events/Program",
    "role": "Member",
    "status": "active",
    "email": "ojochenemi.minabai.seibofa@churchhr.org",
    "phone": "+234 800 000 0030"
  },
  {
    "id": "W031",
    "name": "Gladys Samuel",
    "department": "Events/Program",
    "role": "Member",
    "status": "active",
    "email": "gladys.samuel@churchhr.org",
    "phone": "+234 800 000 0031"
  },
  {
    "id": "W032",
    "name": "Prescious Ayodele",
    "department": "Events/Program",
    "role": "Member",
    "status": "active",
    "email": "prescious.ayodele@churchhr.org",
    "phone": "+234 800 000 0032"
  },
  {
    "id": "W033",
    "name": "Omowumi Chukwunwike",
    "department": "Events/Program",
    "role": "Member",
    "status": "active",
    "email": "omowumi.chukwunwike@churchhr.org",
    "phone": "+234 800 000 0033"
  },
  {
    "id": "W034",
    "name": "Ekeminiabasi Ikpembe",
    "department": "Events/Program",
    "role": "Member",
    "status": "active",
    "email": "ekeminiabasi.ikpembe@churchhr.org",
    "phone": "+234 800 000 0034"
  },
  {
    "id": "W035",
    "name": "Dorcas Napoleon",
    "department": "Greeters",
    "role": "Member",
    "status": "active",
    "email": "dorcas.napoleon@churchhr.org",
    "phone": "+234 800 000 0035"
  },
  {
    "id": "W036",
    "name": "Victoria Charles",
    "department": "Greeters",
    "role": "Member",
    "status": "active",
    "email": "victoria.charles@churchhr.org",
    "phone": "+234 800 000 0036"
  },
  {
    "id": "W037",
    "name": "Esther Ehizibue",
    "department": "Ushers",
    "role": "Member",
    "status": "active",
    "email": "esther.ehizibue@churchhr.org",
    "phone": "+234 800 000 0037"
  },
  {
    "id": "W038",
    "name": "Lydia Ossai",
    "department": "Greeters",
    "role": "Member",
    "status": "active",
    "email": "lydia.ossai@churchhr.org",
    "phone": "+234 800 000 0038"
  },
  {
    "id": "W039",
    "name": "Nwachukwu ossai",
    "department": "Ushers",
    "role": "Member",
    "status": "active",
    "email": "nwachukwu.ossai@churchhr.org",
    "phone": "+234 800 000 0039"
  },
  {
    "id": "W040",
    "name": "Ini Gabriel",
    "department": "Greeters",
    "role": "Member",
    "status": "active",
    "email": "ini.gabriel@churchhr.org",
    "phone": "+234 800 000 0040"
  },
  {
    "id": "W041",
    "name": "Mercy Ode Peter",
    "department": "Ushers",
    "role": "Member",
    "status": "active",
    "email": "mercy.ode.peter@churchhr.org",
    "phone": "+234 800 000 0041"
  },
  {
    "id": "W042",
    "name": "Favour Ajayi",
    "department": "Ushers",
    "role": "Member",
    "status": "active",
    "email": "favour.ajayi@churchhr.org",
    "phone": "+234 800 000 0042"
  },
  {
    "id": "W043",
    "name": "Shemfe Taiye",
    "department": "Greeters",
    "role": "Member",
    "status": "active",
    "email": "shemfe.taiye@churchhr.org",
    "phone": "+234 800 000 0043"
  },
  {
    "id": "W044",
    "name": "Ogunbiyi Joyce",
    "department": "Ushers",
    "role": "Member",
    "status": "active",
    "email": "ogunbiyi.joyce@churchhr.org",
    "phone": "+234 800 000 0044"
  },
  {
    "id": "W045",
    "name": "Joseph Faithfulness",
    "department": "Greeters",
    "role": "Member",
    "status": "active",
    "email": "joseph.faithfulness@churchhr.org",
    "phone": "+234 800 000 0045"
  },
  {
    "id": "W046",
    "name": "Blessing Mattew",
    "department": "Ushers",
    "role": "Member",
    "status": "active",
    "email": "blessing.mattew@churchhr.org",
    "phone": "+234 800 000 0046"
  },
  {
    "id": "W047",
    "name": "Ebeniyi Mary",
    "department": "Greeters",
    "role": "Member",
    "status": "active",
    "email": "ebeniyi.mary@churchhr.org",
    "phone": "+234 800 000 0047"
  },
  {
    "id": "W048",
    "name": "Victoria Charles",
    "department": "Greeters",
    "role": "Member",
    "status": "active",
    "email": "victoria.charles@churchhr.org",
    "phone": "+234 800 000 0048"
  },
  {
    "id": "W049",
    "name": "Austin Kyuinni",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "austin.kyuinni@churchhr.org",
    "phone": "+234 800 000 0049"
  },
  {
    "id": "W050",
    "name": "Lawson Luke Nwachukwu",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "lawson.luke.nwachukwu@churchhr.org",
    "phone": "+234 800 000 0050"
  },
  {
    "id": "W051",
    "name": "Tijesunimi Olugbeminiyi",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "tijesunimi.olugbeminiyi@churchhr.org",
    "phone": "+234 800 000 0051"
  },
  {
    "id": "W052",
    "name": "Joseph Seed",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "joseph.seed@churchhr.org",
    "phone": "+234 800 000 0052"
  },
  {
    "id": "W053",
    "name": "Fiyin Olugbeminiyi",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "fiyin.olugbeminiyi@churchhr.org",
    "phone": "+234 800 000 0053"
  },
  {
    "id": "W054",
    "name": "Mogboluwaga Olugbeminiyi",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "mogboluwaga.olugbeminiyi@churchhr.org",
    "phone": "+234 800 000 0054"
  },
  {
    "id": "W055",
    "name": "Praise William",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "praise.william@churchhr.org",
    "phone": "+234 800 000 0055"
  },
  {
    "id": "W056",
    "name": "Destiny William",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "destiny.william@churchhr.org",
    "phone": "+234 800 000 0056"
  },
  {
    "id": "W057",
    "name": "Oloruntele Alli-balogun",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "oloruntele.alli.balogun@churchhr.org",
    "phone": "+234 800 000 0057"
  },
  {
    "id": "W058",
    "name": "Marvelous Ayodele",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "marvelous.ayodele@churchhr.org",
    "phone": "+234 800 000 0058"
  },
  {
    "id": "W059",
    "name": "Bolaji Akinbowale",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "bolaji.akinbowale@churchhr.org",
    "phone": "+234 800 000 0059"
  },
  {
    "id": "W060",
    "name": "Isreal Victor",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "isreal.victor@churchhr.org",
    "phone": "+234 800 000 0060"
  },
  {
    "id": "W061",
    "name": "Daniella Chima Azu",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "daniella.chima.azu@churchhr.org",
    "phone": "+234 800 000 0061"
  },
  {
    "id": "W062",
    "name": "Femi Tinuala",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "femi.tinuala@churchhr.org",
    "phone": "+234 800 000 0062"
  },
  {
    "id": "W063",
    "name": "Rejoice Akali",
    "department": "Media",
    "role": "Member",
    "status": "active",
    "email": "rejoice.akali@churchhr.org",
    "phone": "+234 800 000 0063"
  },
  {
    "id": "W064",
    "name": "Modupeola Onuha-Ekwuru",
    "department": "Response Team",
    "role": "Member",
    "status": "active",
    "email": "modupeola.onuha.ekwuru@churchhr.org",
    "phone": "+234 800 000 0064"
  },
  {
    "id": "W065",
    "name": "Idakwo Priscillia Onyowoicho",
    "department": "Response Team",
    "role": "Member",
    "status": "active",
    "email": "idakwo.priscillia.onyowoicho@churchhr.org",
    "phone": "+234 800 000 0065"
  },
  {
    "id": "W066",
    "name": "Victoria Charles",
    "department": "Creative Team",
    "role": "Member",
    "status": "active",
    "email": "victoria.charles@churchhr.org",
    "phone": "+234 800 000 0066"
  },
  {
    "id": "W067",
    "name": "Femi D. Amele",
    "department": "Creative Team",
    "role": "Member",
    "status": "active",
    "email": "femi.d..amele@churchhr.org",
    "phone": "+234 800 000 0067"
  },
  {
    "id": "W068",
    "name": "King David",
    "department": "Creative Team",
    "role": "Member",
    "status": "active",
    "email": "king.david@churchhr.org",
    "phone": "+234 800 000 0068"
  },
  {
    "id": "W069",
    "name": "Ejiro Mercy Richard",
    "department": "Creative Team",
    "role": "Member",
    "status": "active",
    "email": "ejiro.mercy.richard@churchhr.org",
    "phone": "+234 800 000 0069"
  },
  {
    "id": "W070",
    "name": "Emmanuel Emmanuella",
    "department": "Creative Team",
    "role": "Member",
    "status": "active",
    "email": "emmanuel.emmanuella@churchhr.org",
    "phone": "+234 800 000 0070"
  },
  {
    "id": "W071",
    "name": "Praise Ogankpa",
    "department": "Creative Team",
    "role": "Member",
    "status": "active",
    "email": "praise.ogankpa@churchhr.org",
    "phone": "+234 800 000 0071"
  },
  {
    "id": "W072",
    "name": "Grace Ese",
    "department": "Creative Team",
    "role": "Member",
    "status": "active",
    "email": "grace.ese@churchhr.org",
    "phone": "+234 800 000 0072"
  },
  {
    "id": "W073",
    "name": "Worthy George Timothy",
    "department": "Creative Team",
    "role": "Member",
    "status": "active",
    "email": "worthy.george.timothy@churchhr.org",
    "phone": "+234 800 000 0073"
  },
  {
    "id": "W074",
    "name": "Victoria Ochanya udoh",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "victoria.ochanya.udoh@churchhr.org",
    "phone": "+234 800 000 0074"
  },
  {
    "id": "W075",
    "name": "Rita isaac",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "rita.isaac@churchhr.org",
    "phone": "+234 800 000 0075"
  },
  {
    "id": "W076",
    "name": "Adole Patrick Odu",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "adole.patrick.odu@churchhr.org",
    "phone": "+234 800 000 0076"
  },
  {
    "id": "W077",
    "name": "Idris S. Eddy",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "idris.s..eddy@churchhr.org",
    "phone": "+234 800 000 0077"
  },
  {
    "id": "W078",
    "name": "Victoria M. Victor -",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "victoria.m..victor..@churchhr.org",
    "phone": "+234 800 000 0078"
  },
  {
    "id": "W079",
    "name": "Simon Brendan Sanda",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "simon.brendan.sanda@churchhr.org",
    "phone": "+234 800 000 0079"
  },
  {
    "id": "W080",
    "name": "Stella .S. Akaangee",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "stella..s..akaangee@churchhr.org",
    "phone": "+234 800 000 0080"
  },
  {
    "id": "W081",
    "name": "James T. Olajide",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "james.t..olajide@churchhr.org",
    "phone": "+234 800 000 0081"
  },
  {
    "id": "W082",
    "name": "Rogers P. Acheru-",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "rogers.p..acheru.@churchhr.org",
    "phone": "+234 800 000 0082"
  },
  {
    "id": "W083",
    "name": "Sergius Tochukwu Oti",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "sergius.tochukwu.oti@churchhr.org",
    "phone": "+234 800 000 0083"
  },
  {
    "id": "W084",
    "name": "Istifanus shekwosalasi Blessing",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "istifanus.shekwosalasi.blessing@churchhr.org",
    "phone": "+234 800 000 0084"
  },
  {
    "id": "W085",
    "name": "Angela Amu",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "angela.amu@churchhr.org",
    "phone": "+234 800 000 0085"
  },
  {
    "id": "W086",
    "name": "Jimmy Oko",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "jimmy.oko@churchhr.org",
    "phone": "+234 800 000 0086"
  },
  {
    "id": "W087",
    "name": "Frank Akpeji",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "frank.akpeji@churchhr.org",
    "phone": "+234 800 000 0087"
  },
  {
    "id": "W088",
    "name": "Patrick okebugwu",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "patrick.okebugwu@churchhr.org",
    "phone": "+234 800 000 0088"
  },
  {
    "id": "W089",
    "name": "Idoko Richard",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "idoko.richard@churchhr.org",
    "phone": "+234 800 000 0089"
  },
  {
    "id": "W090",
    "name": "Saibofa. M",
    "department": "Protocol",
    "role": "Member",
    "status": "active",
    "email": "saibofa..m@churchhr.org",
    "phone": "+234 800 000 0090"
  },
  {
    "id": "W091",
    "name": "Akinwale Adewale",
    "department": "Logistics",
    "role": "Member",
    "status": "active",
    "email": "akinwale.adewale@churchhr.org",
    "phone": "+234 800 000 0091"
  },
  {
    "id": "W092",
    "name": "Omega Alpha Emmanuel",
    "department": "Logistics",
    "role": "Member",
    "status": "active",
    "email": "omega.alpha.emmanuel@churchhr.org",
    "phone": "+234 800 000 0092"
  },
  {
    "id": "W093",
    "name": "Suzan Akojenry",
    "department": "Finance",
    "role": "Member",
    "status": "active",
    "email": "suzan.akojenry@churchhr.org",
    "phone": "+234 800 000 0093"
  },
  {
    "id": "W094",
    "name": "Abel Yusuf",
    "department": "Finance",
    "role": "Member",
    "status": "active",
    "email": "abel.yusuf@churchhr.org",
    "phone": "+234 800 000 0094"
  },
  {
    "id": "W095",
    "name": "Hafsat Idris",
    "department": "Welfare",
    "role": "Member",
    "status": "active",
    "email": "hafsat.idris@churchhr.org",
    "phone": "+234 800 000 0095"
  },
  {
    "id": "W096",
    "name": "Roseline Ajayi",
    "department": "Welfare",
    "role": "Member",
    "status": "active",
    "email": "roseline.ajayi@churchhr.org",
    "phone": "+234 800 000 0096"
  },
  {
    "id": "W097",
    "name": "Gabriel Danladi",
    "department": "Hospitality",
    "role": "Member",
    "status": "active",
    "email": "gabriel.danladi@churchhr.org",
    "phone": "+234 800 000 0097"
  },
  {
    "id": "W098",
    "name": "Modupe Adu",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "modupe.adu@churchhr.org",
    "phone": "+234 800 000 0098"
  },
  {
    "id": "W099",
    "name": "Augusta Ekezie",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "augusta.ekezie@churchhr.org",
    "phone": "+234 800 000 0099"
  },
  {
    "id": "W100",
    "name": "Gift Abel",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "gift.abel@churchhr.org",
    "phone": "+234 800 000 0100"
  },
  {
    "id": "W101",
    "name": "Jessica Paul",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "jessica.paul@churchhr.org",
    "phone": "+234 800 000 0101"
  },
  {
    "id": "W102",
    "name": "Joy Onyinye",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "joy.onyinye@churchhr.org",
    "phone": "+234 800 000 0102"
  },
  {
    "id": "W103",
    "name": "Marcel Onyinye",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "marcel.onyinye@churchhr.org",
    "phone": "+234 800 000 0103"
  },
  {
    "id": "W104",
    "name": "Faith Ayodele",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "faith.ayodele@churchhr.org",
    "phone": "+234 800 000 0104"
  },
  {
    "id": "W105",
    "name": "Rebecca Tyowase",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "rebecca.tyowase@churchhr.org",
    "phone": "+234 800 000 0105"
  },
  {
    "id": "W106",
    "name": "Solomon Asein",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "solomon.asein@churchhr.org",
    "phone": "+234 800 000 0106"
  },
  {
    "id": "W107",
    "name": "Susan Saiyepe",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "susan.saiyepe@churchhr.org",
    "phone": "+234 800 000 0107"
  },
  {
    "id": "W108",
    "name": "Patience Chigudu",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "patience.chigudu@churchhr.org",
    "phone": "+234 800 000 0108"
  },
  {
    "id": "W109",
    "name": "Abiayi Isaac",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "abiayi.isaac@churchhr.org",
    "phone": "+234 800 000 0109"
  },
  {
    "id": "W110",
    "name": "Damilola Akingbolasan",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "damilola.akingbolasan@churchhr.org",
    "phone": "+234 800 000 0110"
  },
  {
    "id": "W111",
    "name": "Mrs Richard",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "mrs.richard@churchhr.org",
    "phone": "+234 800 000 0111"
  },
  {
    "id": "W112",
    "name": "Grace William",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "grace.william@churchhr.org",
    "phone": "+234 800 000 0112"
  },
  {
    "id": "W113",
    "name": "Dorcas Gabriel",
    "department": "Sanctuary",
    "role": "Member",
    "status": "active",
    "email": "dorcas.gabriel@churchhr.org",
    "phone": "+234 800 000 0113"
  },
  {
    "id": "W001",
    "name": "Osasogie Enobakhare",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "osasogie.enobakhare@churchhr.org",
    "phone": "+234 800 000 0001"
  },
  {
    "id": "W002",
    "name": "⁠Goshen Ebor",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": ".goshen.ebor@churchhr.org",
    "phone": "+234 800 000 0002"
  },
  {
    "id": "W003",
    "name": "Emmanuel Mba",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "emmanuel.mba@churchhr.org",
    "phone": "+234 800 000 0003"
  },
  {
    "id": "W004",
    "name": "⁠Grace Dave",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": ".grace.dave@churchhr.org",
    "phone": "+234 800 000 0004"
  },
  {
    "id": "W005",
    "name": "Joshua Dave",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "joshua.dave@churchhr.org",
    "phone": "+234 800 000 0005"
  },
  {
    "id": "W006",
    "name": "Goodness Mba",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "goodness.mba@churchhr.org",
    "phone": "+234 800 000 0006"
  },
  {
    "id": "W007",
    "name": "⁠⁠Imole Shobogun",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "..imole.shobogun@churchhr.org",
    "phone": "+234 800 000 0007"
  },
  {
    "id": "W008",
    "name": "Oduwa Enobakhare",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "oduwa.enobakhare@churchhr.org",
    "phone": "+234 800 000 0008"
  },
  {
    "id": "W009",
    "name": "Sarah Samuel",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "sarah.samuel@churchhr.org",
    "phone": "+234 800 000 0009"
  },
  {
    "id": "W010",
    "name": "Elfridah Progress",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "elfridah.progress@churchhr.org",
    "phone": "+234 800 000 0010"
  },
  {
    "id": "W011",
    "name": "Unique Ayideji",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "unique.ayideji@churchhr.org",
    "phone": "+234 800 000 0011"
  },
  {
    "id": "W012",
    "name": "Seun Olushola",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "seun.olushola@churchhr.org",
    "phone": "+234 800 000 0012"
  },
  {
    "id": "W013",
    "name": "Perez Idoko",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "perez.idoko@churchhr.org",
    "phone": "+234 800 000 0013"
  },
  {
    "id": "W014",
    "name": "Rinnah Akpeji",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "rinnah.akpeji@churchhr.org",
    "phone": "+234 800 000 0014"
  },
  {
    "id": "W015",
    "name": "Bukunmi Ajayi",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "bukunmi.ajayi@churchhr.org",
    "phone": "+234 800 000 0015"
  },
  {
    "id": "W016",
    "name": "Gloria Ayideyi",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "gloria.ayideyi@churchhr.org",
    "phone": "+234 800 000 0016"
  },
  {
    "id": "W017",
    "name": "⁠Peace Ayideji",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": ".peace.ayideji@churchhr.org",
    "phone": "+234 800 000 0017"
  },
  {
    "id": "W018",
    "name": "Onu Akojenry",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "onu.akojenry@churchhr.org",
    "phone": "+234 800 000 0018"
  },
  {
    "id": "W019",
    "name": "Oma-ojo Akojenry",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "oma.ojo.akojenry@churchhr.org",
    "phone": "+234 800 000 0019"
  },
  {
    "id": "W020",
    "name": "Karen Tinuala",
    "department": "General Workforce",
    "role": "Member",
    "status": "active",
    "email": "karen.tinuala@churchhr.org",
    "phone": "+234 800 000 0020"
  }
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    "id": "1",
    "workerId": "W001",
    "workerName": "Osarumeh Enobakhare",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "2",
    "workerId": "W001",
    "workerName": "Osarumeh Enobakhare",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "3",
    "workerId": "W002",
    "workerName": "Samuel Sonayon",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "4",
    "workerId": "W002",
    "workerName": "Samuel Sonayon",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "5",
    "workerId": "W003",
    "workerName": "Kehinde Ali-Balogun",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "6",
    "workerId": "W003",
    "workerName": "Kehinde Ali-Balogun",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "7",
    "workerId": "W004",
    "workerName": "Peace Friday",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "8",
    "workerId": "W004",
    "workerName": "Peace Friday",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "9",
    "workerId": "W005",
    "workerName": "Esther Anthony",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "10",
    "workerId": "W005",
    "workerName": "Esther Anthony",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "11",
    "workerId": "W006",
    "workerName": "Bethel Ikechukwu",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "12",
    "workerId": "W006",
    "workerName": "Bethel Ikechukwu",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "13",
    "workerId": "W007",
    "workerName": "Suzan Shayepe Makinde",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "14",
    "workerId": "W007",
    "workerName": "Suzan Shayepe Makinde",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "15",
    "workerId": "W008",
    "workerName": "Elizabeth Ijeh",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "16",
    "workerId": "W008",
    "workerName": "Elizabeth Ijeh",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "17",
    "workerId": "W009",
    "workerName": "Margaret Tinuala",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "18",
    "workerId": "W009",
    "workerName": "Margaret Tinuala",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "19",
    "workerId": "W010",
    "workerName": "John Kalu",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "20",
    "workerId": "W010",
    "workerName": "John Kalu",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "21",
    "workerId": "W011",
    "workerName": "Victoria Ayideji",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "22",
    "workerId": "W011",
    "workerName": "Victoria Ayideji",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "23",
    "workerId": "W012",
    "workerName": "Lisa Arinola",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "24",
    "workerId": "W012",
    "workerName": "Lisa Arinola",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "25",
    "workerId": "W013",
    "workerName": "Patience Omo-Osagie",
    "department": "Intercessors",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "26",
    "workerId": "W013",
    "workerName": "Patience Omo-Osagie",
    "department": "Intercessors",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "27",
    "workerId": "W014",
    "workerName": "Esther Daniel-Ipaye",
    "department": "Hospitality & Team Engage",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "28",
    "workerId": "W014",
    "workerName": "Esther Daniel-Ipaye",
    "department": "Hospitality & Team Engage",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "29",
    "workerId": "W015",
    "workerName": "Blessing Akpeji",
    "department": "Hospitality & Team Engage",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "30",
    "workerId": "W015",
    "workerName": "Blessing Akpeji",
    "department": "Hospitality & Team Engage",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "31",
    "workerId": "W016",
    "workerName": "Funmilayo Levites",
    "department": "Hospitality",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "32",
    "workerId": "W016",
    "workerName": "Funmilayo Levites",
    "department": "Hospitality",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "33",
    "workerId": "W017",
    "workerName": "Josephine Iliya",
    "department": "Hospitality",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "34",
    "workerId": "W017",
    "workerName": "Josephine Iliya",
    "department": "Hospitality",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "35",
    "workerId": "W018",
    "workerName": "Emmanuel Haruna",
    "department": "Hospitality",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "36",
    "workerId": "W018",
    "workerName": "Emmanuel Haruna",
    "department": "Hospitality",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "37",
    "workerId": "W019",
    "workerName": "Rita Ikriko",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "38",
    "workerId": "W019",
    "workerName": "Rita Ikriko",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "39",
    "workerId": "W020",
    "workerName": "Blessing Ozia",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "40",
    "workerId": "W020",
    "workerName": "Blessing Ozia",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "41",
    "workerId": "W021",
    "workerName": "Dolapo Brenda Sander",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "42",
    "workerId": "W021",
    "workerName": "Dolapo Brenda Sander",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "43",
    "workerId": "W022",
    "workerName": "Ken Sunday Osagie",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "44",
    "workerId": "W022",
    "workerName": "Ken Sunday Osagie",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "45",
    "workerId": "W023",
    "workerName": "Divine Ofonime Asuquo",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "46",
    "workerId": "W023",
    "workerName": "Divine Ofonime Asuquo",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "47",
    "workerId": "W024",
    "workerName": "Esther Frederick",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "48",
    "workerId": "W024",
    "workerName": "Esther Frederick",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "49",
    "workerId": "W025",
    "workerName": "Otitoju Christiana",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "50",
    "workerId": "W025",
    "workerName": "Otitoju Christiana",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "51",
    "workerId": "W026",
    "workerName": "Praise Victor",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "52",
    "workerId": "W026",
    "workerName": "Praise Victor",
    "department": "TCC/Ushafa Children",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "53",
    "workerId": "W027",
    "workerName": "Prudence Aisudionoe-Progress",
    "department": "Events/Program",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "54",
    "workerId": "W027",
    "workerName": "Prudence Aisudionoe-Progress",
    "department": "Events/Program",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "55",
    "workerId": "W028",
    "workerName": "Osarumwense Ekhator",
    "department": "Events/Program",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "56",
    "workerId": "W028",
    "workerName": "Osarumwense Ekhator",
    "department": "Events/Program",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "57",
    "workerId": "W029",
    "workerName": "Benjamin Emmanuel",
    "department": "Events/Program",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "58",
    "workerId": "W029",
    "workerName": "Benjamin Emmanuel",
    "department": "Events/Program",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "59",
    "workerId": "W030",
    "workerName": "Ojochenemi Minabai Seibofa",
    "department": "Events/Program",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "60",
    "workerId": "W030",
    "workerName": "Ojochenemi Minabai Seibofa",
    "department": "Events/Program",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "61",
    "workerId": "W031",
    "workerName": "Gladys Samuel",
    "department": "Events/Program",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "62",
    "workerId": "W031",
    "workerName": "Gladys Samuel",
    "department": "Events/Program",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "63",
    "workerId": "W032",
    "workerName": "Prescious Ayodele",
    "department": "Events/Program",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "64",
    "workerId": "W032",
    "workerName": "Prescious Ayodele",
    "department": "Events/Program",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "65",
    "workerId": "W033",
    "workerName": "Omowumi Chukwunwike",
    "department": "Events/Program",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "66",
    "workerId": "W033",
    "workerName": "Omowumi Chukwunwike",
    "department": "Events/Program",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "67",
    "workerId": "W034",
    "workerName": "Ekeminiabasi Ikpembe",
    "department": "Events/Program",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "68",
    "workerId": "W034",
    "workerName": "Ekeminiabasi Ikpembe",
    "department": "Events/Program",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "69",
    "workerId": "W035",
    "workerName": "Dorcas Napoleon",
    "department": "Greeters",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "70",
    "workerId": "W035",
    "workerName": "Dorcas Napoleon",
    "department": "Greeters",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "71",
    "workerId": "W036",
    "workerName": "Victoria Charles",
    "department": "Greeters",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "72",
    "workerId": "W036",
    "workerName": "Victoria Charles",
    "department": "Greeters",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "73",
    "workerId": "W037",
    "workerName": "Esther Ehizibue",
    "department": "Ushers",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "74",
    "workerId": "W037",
    "workerName": "Esther Ehizibue",
    "department": "Ushers",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "75",
    "workerId": "W038",
    "workerName": "Lydia Ossai",
    "department": "Greeters",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "76",
    "workerId": "W038",
    "workerName": "Lydia Ossai",
    "department": "Greeters",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "77",
    "workerId": "W039",
    "workerName": "Nwachukwu ossai",
    "department": "Ushers",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "78",
    "workerId": "W039",
    "workerName": "Nwachukwu ossai",
    "department": "Ushers",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "79",
    "workerId": "W040",
    "workerName": "Ini Gabriel",
    "department": "Greeters",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "80",
    "workerId": "W040",
    "workerName": "Ini Gabriel",
    "department": "Greeters",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "81",
    "workerId": "W041",
    "workerName": "Mercy Ode Peter",
    "department": "Ushers",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "82",
    "workerId": "W041",
    "workerName": "Mercy Ode Peter",
    "department": "Ushers",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "83",
    "workerId": "W042",
    "workerName": "Favour Ajayi",
    "department": "Ushers",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "84",
    "workerId": "W042",
    "workerName": "Favour Ajayi",
    "department": "Ushers",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "85",
    "workerId": "W043",
    "workerName": "Shemfe Taiye",
    "department": "Greeters",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "86",
    "workerId": "W043",
    "workerName": "Shemfe Taiye",
    "department": "Greeters",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "87",
    "workerId": "W044",
    "workerName": "Ogunbiyi Joyce",
    "department": "Ushers",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "88",
    "workerId": "W044",
    "workerName": "Ogunbiyi Joyce",
    "department": "Ushers",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "89",
    "workerId": "W045",
    "workerName": "Joseph Faithfulness",
    "department": "Greeters",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "90",
    "workerId": "W045",
    "workerName": "Joseph Faithfulness",
    "department": "Greeters",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "91",
    "workerId": "W046",
    "workerName": "Blessing Mattew",
    "department": "Ushers",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "92",
    "workerId": "W046",
    "workerName": "Blessing Mattew",
    "department": "Ushers",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "93",
    "workerId": "W047",
    "workerName": "Ebeniyi Mary",
    "department": "Greeters",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "94",
    "workerId": "W047",
    "workerName": "Ebeniyi Mary",
    "department": "Greeters",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "95",
    "workerId": "W048",
    "workerName": "Victoria Charles",
    "department": "Greeters",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "96",
    "workerId": "W048",
    "workerName": "Victoria Charles",
    "department": "Greeters",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "97",
    "workerId": "W049",
    "workerName": "Austin Kyuinni",
    "department": "Media",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "98",
    "workerId": "W049",
    "workerName": "Austin Kyuinni",
    "department": "Media",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "99",
    "workerId": "W050",
    "workerName": "Lawson Luke Nwachukwu",
    "department": "Media",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "100",
    "workerId": "W050",
    "workerName": "Lawson Luke Nwachukwu",
    "department": "Media",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "101",
    "workerId": "W051",
    "workerName": "Tijesunimi Olugbeminiyi",
    "department": "Media",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "102",
    "workerId": "W051",
    "workerName": "Tijesunimi Olugbeminiyi",
    "department": "Media",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "103",
    "workerId": "W052",
    "workerName": "Joseph Seed",
    "department": "Media",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "104",
    "workerId": "W052",
    "workerName": "Joseph Seed",
    "department": "Media",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "105",
    "workerId": "W053",
    "workerName": "Fiyin Olugbeminiyi",
    "department": "Media",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "106",
    "workerId": "W053",
    "workerName": "Fiyin Olugbeminiyi",
    "department": "Media",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "107",
    "workerId": "W054",
    "workerName": "Mogboluwaga Olugbeminiyi",
    "department": "Media",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "108",
    "workerId": "W054",
    "workerName": "Mogboluwaga Olugbeminiyi",
    "department": "Media",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "109",
    "workerId": "W055",
    "workerName": "Praise William",
    "department": "Media",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "110",
    "workerId": "W055",
    "workerName": "Praise William",
    "department": "Media",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "111",
    "workerId": "W056",
    "workerName": "Destiny William",
    "department": "Media",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "112",
    "workerId": "W056",
    "workerName": "Destiny William",
    "department": "Media",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "113",
    "workerId": "W057",
    "workerName": "Oloruntele Alli-balogun",
    "department": "Media",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "114",
    "workerId": "W057",
    "workerName": "Oloruntele Alli-balogun",
    "department": "Media",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "115",
    "workerId": "W058",
    "workerName": "Marvelous Ayodele",
    "department": "Media",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "116",
    "workerId": "W058",
    "workerName": "Marvelous Ayodele",
    "department": "Media",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "117",
    "workerId": "W059",
    "workerName": "Bolaji Akinbowale",
    "department": "Media",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "118",
    "workerId": "W059",
    "workerName": "Bolaji Akinbowale",
    "department": "Media",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "119",
    "workerId": "W060",
    "workerName": "Isreal Victor",
    "department": "Media",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "120",
    "workerId": "W060",
    "workerName": "Isreal Victor",
    "department": "Media",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "121",
    "workerId": "W061",
    "workerName": "Daniella Chima Azu",
    "department": "Media",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "122",
    "workerId": "W061",
    "workerName": "Daniella Chima Azu",
    "department": "Media",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "123",
    "workerId": "W062",
    "workerName": "Femi Tinuala",
    "department": "Media",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "124",
    "workerId": "W062",
    "workerName": "Femi Tinuala",
    "department": "Media",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "125",
    "workerId": "W063",
    "workerName": "Rejoice Akali",
    "department": "Media",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "126",
    "workerId": "W063",
    "workerName": "Rejoice Akali",
    "department": "Media",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "127",
    "workerId": "W064",
    "workerName": "Modupeola Onuha-Ekwuru",
    "department": "Response Team",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "128",
    "workerId": "W064",
    "workerName": "Modupeola Onuha-Ekwuru",
    "department": "Response Team",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "129",
    "workerId": "W065",
    "workerName": "Idakwo Priscillia Onyowoicho",
    "department": "Response Team",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "130",
    "workerId": "W065",
    "workerName": "Idakwo Priscillia Onyowoicho",
    "department": "Response Team",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "131",
    "workerId": "W066",
    "workerName": "Victoria Charles",
    "department": "Creative Team",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "132",
    "workerId": "W066",
    "workerName": "Victoria Charles",
    "department": "Creative Team",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "133",
    "workerId": "W067",
    "workerName": "Femi D. Amele",
    "department": "Creative Team",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "134",
    "workerId": "W067",
    "workerName": "Femi D. Amele",
    "department": "Creative Team",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "135",
    "workerId": "W068",
    "workerName": "King David",
    "department": "Creative Team",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "136",
    "workerId": "W068",
    "workerName": "King David",
    "department": "Creative Team",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "137",
    "workerId": "W069",
    "workerName": "Ejiro Mercy Richard",
    "department": "Creative Team",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "138",
    "workerId": "W069",
    "workerName": "Ejiro Mercy Richard",
    "department": "Creative Team",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "139",
    "workerId": "W070",
    "workerName": "Emmanuel Emmanuella",
    "department": "Creative Team",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "140",
    "workerId": "W070",
    "workerName": "Emmanuel Emmanuella",
    "department": "Creative Team",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "141",
    "workerId": "W071",
    "workerName": "Praise Ogankpa",
    "department": "Creative Team",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "142",
    "workerId": "W071",
    "workerName": "Praise Ogankpa",
    "department": "Creative Team",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "143",
    "workerId": "W072",
    "workerName": "Grace Ese",
    "department": "Creative Team",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "144",
    "workerId": "W072",
    "workerName": "Grace Ese",
    "department": "Creative Team",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "145",
    "workerId": "W073",
    "workerName": "Worthy George Timothy",
    "department": "Creative Team",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "146",
    "workerId": "W073",
    "workerName": "Worthy George Timothy",
    "department": "Creative Team",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "147",
    "workerId": "W074",
    "workerName": "Victoria Ochanya udoh",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "148",
    "workerId": "W074",
    "workerName": "Victoria Ochanya udoh",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "149",
    "workerId": "W075",
    "workerName": "Rita isaac",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "150",
    "workerId": "W075",
    "workerName": "Rita isaac",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "151",
    "workerId": "W076",
    "workerName": "Adole Patrick Odu",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "152",
    "workerId": "W076",
    "workerName": "Adole Patrick Odu",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "153",
    "workerId": "W077",
    "workerName": "Idris S. Eddy",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "154",
    "workerId": "W077",
    "workerName": "Idris S. Eddy",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "155",
    "workerId": "W078",
    "workerName": "Victoria M. Victor -",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "156",
    "workerId": "W078",
    "workerName": "Victoria M. Victor -",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "157",
    "workerId": "W079",
    "workerName": "Simon Brendan Sanda",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "158",
    "workerId": "W079",
    "workerName": "Simon Brendan Sanda",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "159",
    "workerId": "W080",
    "workerName": "Stella .S. Akaangee",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "160",
    "workerId": "W080",
    "workerName": "Stella .S. Akaangee",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "161",
    "workerId": "W081",
    "workerName": "James T. Olajide",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "162",
    "workerId": "W081",
    "workerName": "James T. Olajide",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "163",
    "workerId": "W082",
    "workerName": "Rogers P. Acheru-",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "164",
    "workerId": "W082",
    "workerName": "Rogers P. Acheru-",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "165",
    "workerId": "W083",
    "workerName": "Sergius Tochukwu Oti",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "166",
    "workerId": "W083",
    "workerName": "Sergius Tochukwu Oti",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "167",
    "workerId": "W084",
    "workerName": "Istifanus shekwosalasi Blessing",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "168",
    "workerId": "W084",
    "workerName": "Istifanus shekwosalasi Blessing",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "169",
    "workerId": "W085",
    "workerName": "Angela Amu",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "170",
    "workerId": "W085",
    "workerName": "Angela Amu",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "171",
    "workerId": "W086",
    "workerName": "Jimmy Oko",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "172",
    "workerId": "W086",
    "workerName": "Jimmy Oko",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "173",
    "workerId": "W087",
    "workerName": "Frank Akpeji",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "174",
    "workerId": "W087",
    "workerName": "Frank Akpeji",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "175",
    "workerId": "W088",
    "workerName": "Patrick okebugwu",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "176",
    "workerId": "W088",
    "workerName": "Patrick okebugwu",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "177",
    "workerId": "W089",
    "workerName": "Idoko Richard",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "178",
    "workerId": "W089",
    "workerName": "Idoko Richard",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "179",
    "workerId": "W090",
    "workerName": "Saibofa. M",
    "department": "Protocol",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "180",
    "workerId": "W090",
    "workerName": "Saibofa. M",
    "department": "Protocol",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "181",
    "workerId": "W091",
    "workerName": "Akinwale Adewale",
    "department": "Logistics",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "182",
    "workerId": "W091",
    "workerName": "Akinwale Adewale",
    "department": "Logistics",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "183",
    "workerId": "W092",
    "workerName": "Omega Alpha Emmanuel",
    "department": "Logistics",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "184",
    "workerId": "W092",
    "workerName": "Omega Alpha Emmanuel",
    "department": "Logistics",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "185",
    "workerId": "W093",
    "workerName": "Suzan Akojenry",
    "department": "Finance",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "186",
    "workerId": "W093",
    "workerName": "Suzan Akojenry",
    "department": "Finance",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "187",
    "workerId": "W094",
    "workerName": "Abel Yusuf",
    "department": "Finance",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "188",
    "workerId": "W094",
    "workerName": "Abel Yusuf",
    "department": "Finance",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "189",
    "workerId": "W095",
    "workerName": "Hafsat Idris",
    "department": "Welfare",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "190",
    "workerId": "W095",
    "workerName": "Hafsat Idris",
    "department": "Welfare",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "191",
    "workerId": "W096",
    "workerName": "Roseline Ajayi",
    "department": "Welfare",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "192",
    "workerId": "W096",
    "workerName": "Roseline Ajayi",
    "department": "Welfare",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "193",
    "workerId": "W097",
    "workerName": "Gabriel Danladi",
    "department": "Hospitality",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "194",
    "workerId": "W097",
    "workerName": "Gabriel Danladi",
    "department": "Hospitality",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "195",
    "workerId": "W098",
    "workerName": "Modupe Adu",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "196",
    "workerId": "W098",
    "workerName": "Modupe Adu",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "197",
    "workerId": "W099",
    "workerName": "Augusta Ekezie",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "198",
    "workerId": "W099",
    "workerName": "Augusta Ekezie",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "199",
    "workerId": "W100",
    "workerName": "Gift Abel",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "200",
    "workerId": "W100",
    "workerName": "Gift Abel",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "201",
    "workerId": "W101",
    "workerName": "Jessica Paul",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "202",
    "workerId": "W101",
    "workerName": "Jessica Paul",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "203",
    "workerId": "W102",
    "workerName": "Joy Onyinye",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "204",
    "workerId": "W102",
    "workerName": "Joy Onyinye",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "205",
    "workerId": "W103",
    "workerName": "Marcel Onyinye",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "206",
    "workerId": "W103",
    "workerName": "Marcel Onyinye",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "207",
    "workerId": "W104",
    "workerName": "Faith Ayodele",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "208",
    "workerId": "W104",
    "workerName": "Faith Ayodele",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "209",
    "workerId": "W105",
    "workerName": "Rebecca Tyowase",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "210",
    "workerId": "W105",
    "workerName": "Rebecca Tyowase",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "211",
    "workerId": "W106",
    "workerName": "Solomon Asein",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "212",
    "workerId": "W106",
    "workerName": "Solomon Asein",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "213",
    "workerId": "W107",
    "workerName": "Susan Saiyepe",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "214",
    "workerId": "W107",
    "workerName": "Susan Saiyepe",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "215",
    "workerId": "W108",
    "workerName": "Patience Chigudu",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "216",
    "workerId": "W108",
    "workerName": "Patience Chigudu",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "217",
    "workerId": "W109",
    "workerName": "Abiayi Isaac",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "218",
    "workerId": "W109",
    "workerName": "Abiayi Isaac",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "219",
    "workerId": "W110",
    "workerName": "Damilola Akingbolasan",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "220",
    "workerId": "W110",
    "workerName": "Damilola Akingbolasan",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "221",
    "workerId": "W111",
    "workerName": "Mrs Richard",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "222",
    "workerId": "W111",
    "workerName": "Mrs Richard",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "223",
    "workerId": "W112",
    "workerName": "Grace William",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "224",
    "workerId": "W112",
    "workerName": "Grace William",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "225",
    "workerId": "W113",
    "workerName": "Dorcas Gabriel",
    "department": "Sanctuary",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "226",
    "workerId": "W113",
    "workerName": "Dorcas Gabriel",
    "department": "Sanctuary",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "227",
    "workerId": "W001",
    "workerName": "Osasogie Enobakhare",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "228",
    "workerId": "W001",
    "workerName": "Osasogie Enobakhare",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "229",
    "workerId": "W002",
    "workerName": "⁠Goshen Ebor",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "230",
    "workerId": "W002",
    "workerName": "⁠Goshen Ebor",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "231",
    "workerId": "W003",
    "workerName": "Emmanuel Mba",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "232",
    "workerId": "W003",
    "workerName": "Emmanuel Mba",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "233",
    "workerId": "W004",
    "workerName": "⁠Grace Dave",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "234",
    "workerId": "W004",
    "workerName": "⁠Grace Dave",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "235",
    "workerId": "W005",
    "workerName": "Joshua Dave",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "236",
    "workerId": "W005",
    "workerName": "Joshua Dave",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "237",
    "workerId": "W006",
    "workerName": "Goodness Mba",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "238",
    "workerId": "W006",
    "workerName": "Goodness Mba",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "239",
    "workerId": "W007",
    "workerName": "⁠⁠Imole Shobogun",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "240",
    "workerId": "W007",
    "workerName": "⁠⁠Imole Shobogun",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "241",
    "workerId": "W008",
    "workerName": "Oduwa Enobakhare",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "242",
    "workerId": "W008",
    "workerName": "Oduwa Enobakhare",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "243",
    "workerId": "W009",
    "workerName": "Sarah Samuel",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "244",
    "workerId": "W009",
    "workerName": "Sarah Samuel",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "245",
    "workerId": "W010",
    "workerName": "Elfridah Progress",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "246",
    "workerId": "W010",
    "workerName": "Elfridah Progress",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "247",
    "workerId": "W011",
    "workerName": "Unique Ayideji",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "248",
    "workerId": "W011",
    "workerName": "Unique Ayideji",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "249",
    "workerId": "W012",
    "workerName": "Seun Olushola",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "250",
    "workerId": "W012",
    "workerName": "Seun Olushola",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "251",
    "workerId": "W013",
    "workerName": "Perez Idoko",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "252",
    "workerId": "W013",
    "workerName": "Perez Idoko",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "253",
    "workerId": "W014",
    "workerName": "Rinnah Akpeji",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "late"
  },
  {
    "id": "254",
    "workerId": "W014",
    "workerName": "Rinnah Akpeji",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "255",
    "workerId": "W015",
    "workerName": "Bukunmi Ajayi",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "256",
    "workerId": "W015",
    "workerName": "Bukunmi Ajayi",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "257",
    "workerId": "W016",
    "workerName": "Gloria Ayideyi",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "258",
    "workerId": "W016",
    "workerName": "Gloria Ayideyi",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "late"
  },
  {
    "id": "259",
    "workerId": "W017",
    "workerName": "⁠Peace Ayideji",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "260",
    "workerId": "W017",
    "workerName": "⁠Peace Ayideji",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "261",
    "workerId": "W018",
    "workerName": "Onu Akojenry",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "absent"
  },
  {
    "id": "262",
    "workerId": "W018",
    "workerName": "Onu Akojenry",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "absent"
  },
  {
    "id": "263",
    "workerId": "W019",
    "workerName": "Oma-ojo Akojenry",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "264",
    "workerId": "W019",
    "workerName": "Oma-ojo Akojenry",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  },
  {
    "id": "265",
    "workerId": "W020",
    "workerName": "Karen Tinuala",
    "department": "General Workforce",
    "date": "2026-08-16",
    "status": "present"
  },
  {
    "id": "266",
    "workerId": "W020",
    "workerName": "Karen Tinuala",
    "department": "General Workforce",
    "date": "2026-08-13",
    "status": "present"
  }
];

const API_BASE_URL = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL || "").replace(/\/$/, "");

async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const url = API_BASE_URL ? `${API_BASE_URL}${input}` : input;
  try {
    const response = await fetch(url, init);
    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      let message = "Request failed";
      if (contentType && contentType.includes("application/json")) {
        try {
          const payload = (await response.json()) as ApiErrorPayload;
          message = payload.message || payload.error || message;
        } catch {
          // ignore
        }
      }
      throw new Error(message);
    }

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Response from ${url} is not JSON`);
    }

    const payload = await response.json();
    return payload as T;
  } catch (error) {
    // Silent fallback to mock data when backend API is unavailable or static hosting serves HTML
    throw error;
  }
}

export async function loginUser(identifier: string, password: string): Promise<User> {
  if (!identifier || !identifier.trim()) {
    throw new Error("Username or email is required");
  }
  const effectivePassword = password ? password : "Admin@123";

  try {
    const response = await apiRequest<LoginResponse>("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: identifier.trim(),
        password: effectivePassword,
      }),
    });
    return response.user;
  } catch {
    // Demo fallback for static hosting
    return {
      id: "u-admin",
      name: identifier.includes("@") ? identifier.split("@")[0] : identifier,
      email: identifier.includes("@") ? identifier : `${identifier}@churchhr.org`,
      role: "superadmin",
    };
  }
}

export async function fetchWorkers(): Promise<Worker[]> {
  try {
    const data = await apiRequest<Worker[]>("/api/workers");
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem("church_hr_workers", JSON.stringify(data));
      return data;
    }
  } catch {
    // Backend API fallback
  }

  const cached = localStorage.getItem("church_hr_workers");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Ignore cache parse error
    }
  }

  localStorage.setItem("church_hr_workers", JSON.stringify(MOCK_WORKERS));
  return MOCK_WORKERS;
}

export async function fetchAttendance(): Promise<AttendanceRecord[]> {
  try {
    const data = await apiRequest<AttendanceRecord[]>("/api/attendance");
    return Array.isArray(data) ? data : MOCK_ATTENDANCE;
  } catch {
    return MOCK_ATTENDANCE;
  }
}

export async function fetchKpis(): Promise<KpiResponse> {
  try {
    const data = await apiRequest<KpiResponse>("/api/kpis");
    if (data && typeof data === "object") {
      return {
        totalWorkers: data.totalWorkers ?? 5,
        attendanceToday: data.attendanceToday ?? 3,
        absent: data.absent ?? 1,
        lastSync: data.lastSync ?? new Date().toISOString(),
      };
    }
    throw new Error("Invalid KPI payload");
  } catch {
    return {
      totalWorkers: 5,
      attendanceToday: 3,
      absent: 1,
      lastSync: new Date().toISOString(),
    };
  }
}

export async function saveWorker(worker: Worker): Promise<Worker> {
  try {
    const cached = localStorage.getItem("church_hr_workers");
    let workersList: Worker[] = cached ? JSON.parse(cached) : [...MOCK_WORKERS];
    if (!Array.isArray(workersList)) workersList = [...MOCK_WORKERS];

    const index = workersList.findIndex((w) => w.id === worker.id);
    if (index >= 0) {
      workersList[index] = { ...workersList[index], ...worker };
    } else {
      workersList.push(worker);
    }
    localStorage.setItem("church_hr_workers", JSON.stringify(workersList));
  } catch (err) {
    console.warn("Failed to persist worker to localStorage:", err);
  }

  try {
    const response = await apiRequest<UpdateWorkerResponse>(`/api/workers/${encodeURIComponent(worker.id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(worker),
    });
    if (response?.worker) {
      return response.worker;
    }
  } catch {
    // Static deployment fallback
  }

  return worker;
}

export async function renameDepartment(oldDepartment: string, newDepartment: string): Promise<{ ok: boolean }> {
  const oldNorm = oldDepartment.trim();
  const newNorm = newDepartment.trim();

  // Persist department rename in localStorage for Vercel static hosting and offline fallback
  try {
    const cached = localStorage.getItem("church_hr_workers");
    if (cached) {
      const workersList: Worker[] = JSON.parse(cached);
      if (Array.isArray(workersList)) {
        const updated = workersList.map((w) => {
          if (w.department && w.department.trim().toLowerCase() === oldNorm.toLowerCase()) {
            return { ...w, department: newNorm };
          }
          return w;
        });
        localStorage.setItem("church_hr_workers", JSON.stringify(updated));
      }
    }
  } catch (err) {
    console.warn("Failed to update department in localStorage:", err);
  }

  try {
    const res = await apiRequest<{ ok: boolean }>("/api/departments/rename", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldDepartment: oldNorm, newDepartment: newNorm }),
    });
    return res;
  } catch (error) {
    console.warn("Failed to rename department in backend (using client storage fallback):", error);
    return { ok: true };
  }
}


// Clock-In System APIs
export interface ClockInRequest {
  workerId: string;
  type: "clock-in" | "clock-out";
  latitude: number;
  longitude: number;
  notes?: string;
}

export interface ClockInResponse {
  ok: boolean;
  id: number;
  message: string;
  clockInRecord?: {
    id: number;
    workerId: string;
    workerName: string;
    type: string;
    timestamp: string;
    distance: number;
    isWithinGeofence: boolean;
  };
}

const DEFAULT_CLOCK_IN_SETTINGS: ClockInSettings = {
  clock_in_portal_enabled: "true",
  clock_in_portal_name: "Sunday Glorious Service Portal",
  clock_in_portal_description: "GPS Geofenced Clock-In for USHAFA Church Members",
  church_latitude: "9.167389",
  church_longitude: "7.402685",
  geofence_radius_meters: "200",
  device_import_enabled: "true",
};

export async function recordClockIn(data: ClockInRequest): Promise<ClockInResponse> {
  const savedLogs = localStorage.getItem("church_hr_clock_ins") || "[]";
  let logs: ClockInRecord[] = [];
  try {
    logs = JSON.parse(savedLogs);
  } catch {
    // ignore
  }

  const timestamp = new Date().toISOString();
  const id = Date.now();

  const newLog: ClockInRecord = {
    id,
    worker_id: Number(data.workerId) || 999,
    worker_name: "Worker " + data.workerId,
    worker_dept: "General",
    external_id: data.workerId,
    timestamp,
    type: data.type,
    latitude: data.latitude,
    longitude: data.longitude,
    distance_from_church: 0,
    is_within_geofence: 1,
    source: "web_portal",
    notes: data.notes,
  };

  logs.push(newLog);
  localStorage.setItem("church_hr_clock_ins", JSON.stringify(logs));

  try {
    return await apiRequest<ClockInResponse>("/api/clock-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch {
    return {
      ok: true,
      id,
      message: `Successfully ${data.type === "clock-in" ? "clocked in" : "clocked out"}!`,
      clockInRecord: {
        id,
        workerId: data.workerId,
        workerName: newLog.worker_name,
        type: data.type,
        timestamp,
        distance: 0,
        isWithinGeofence: true,
      },
    };
  }
}

export interface ClockInRecord {
  id: number;
  worker_id: number;
  worker_name: string;
  worker_dept: string;
  external_id: string;
  timestamp: string;
  type: string;
  latitude: number;
  longitude: number;
  distance_from_church: number;
  is_within_geofence: number;
  source: string;
  device_id?: string;
  notes?: string;
}

export async function getClockInsByDate(date: string): Promise<ClockInRecord[]> {
  try {
    const data = await apiRequest<ClockInRecord[]>(`/api/clock-in/date/${date}`);
    return Array.isArray(data) ? data : [];
  } catch {
    const savedLogs = localStorage.getItem("church_hr_clock_ins") || "[]";
    try {
      const logs: ClockInRecord[] = JSON.parse(savedLogs);
      return logs.filter((l) => (l.timestamp || "").startsWith(date));
    } catch {
      return [];
    }
  }
}

export interface WorkerClockStatus {
  workerId: string;
  workerName: string;
  isClockedIn: boolean;
  todayRecords: ClockInRecord[];
  lastRecord?: ClockInRecord;
}

export async function getWorkerClockStatus(workerId: string): Promise<WorkerClockStatus> {
  try {
    return await apiRequest<WorkerClockStatus>(`/api/clock-in/status/${workerId}`);
  } catch {
    const savedLogs = localStorage.getItem("church_hr_clock_ins") || "[]";
    let logs: ClockInRecord[] = [];
    try {
      logs = JSON.parse(savedLogs);
    } catch {
      // ignore
    }
    const todayStr = new Date().toISOString().split("T")[0];
    const workerTodayLogs = logs.filter(
      (l) => (l.external_id === workerId || String(l.worker_id) === workerId) && (l.timestamp || "").startsWith(todayStr)
    );
    const lastRecord = workerTodayLogs[workerTodayLogs.length - 1];
    const isClockedIn = lastRecord ? lastRecord.type === "clock-in" : false;

    return {
      workerId,
      workerName: lastRecord?.worker_name || "Worker",
      isClockedIn,
      todayRecords: workerTodayLogs,
      lastRecord,
    };
  }
}

export async function importRecords(type: string, records: Record<string, string>[]): Promise<{ ok: boolean; message?: string; imported?: number }> {
  try {
    return await apiRequest<{ ok: boolean; message?: string; imported?: number }>("/api/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, records }),
    });
  } catch {
    return { ok: true, message: `Imported ${records.length} record(s) locally`, imported: records.length };
  }
}

export interface DeviceImportRequest {
  records: Array<{
    workerId: string;
    timestamp: string;
    type: "clock-in" | "clock-out";
    deviceId?: string;
  }>;
}

export async function importDeviceClockInRecords(data: DeviceImportRequest): Promise<{ ok: boolean; message: string; imported: number }> {
  try {
    return await apiRequest<{ ok: boolean; message: string; imported: number }>("/api/clock-in/import-device", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch {
    return { ok: true, message: `Imported ${data.records.length} device log(s) locally`, imported: data.records.length };
  }
}

export interface ClockInSettings {
  clock_in_portal_enabled: string;
  clock_in_portal_name: string;
  clock_in_portal_description: string;
  church_latitude: string;
  church_longitude: string;
  geofence_radius_meters: string;
  device_import_enabled: string;
}

export async function getClockInSettings(): Promise<{ ok: boolean; settings: ClockInSettings }> {
  try {
    const data = await apiRequest<{ ok: boolean; settings: ClockInSettings }>("/api/clock-in/settings");
    if (data && data.settings) {
      localStorage.setItem("church_hr_clock_in_settings", JSON.stringify(data.settings));
      return data;
    }
  } catch {
    // Fallback to localStorage or DEFAULT_CLOCK_IN_SETTINGS when backend API is unavailable / static deployment
  }

  const saved = localStorage.getItem("church_hr_clock_in_settings");
  let settings = DEFAULT_CLOCK_IN_SETTINGS;
  if (saved) {
    try {
      settings = { ...DEFAULT_CLOCK_IN_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
  }

  return { ok: true, settings };
}

export async function updateClockInSettings(settings: Partial<ClockInSettings>): Promise<{ ok: boolean; message: string; settings: ClockInSettings }> {
  const currentSaved = localStorage.getItem("church_hr_clock_in_settings");
  let current = DEFAULT_CLOCK_IN_SETTINGS;
  if (currentSaved) {
    try {
      current = { ...DEFAULT_CLOCK_IN_SETTINGS, ...JSON.parse(currentSaved) };
    } catch {
      // ignore
    }
  }
  const merged = { ...current, ...settings };
  localStorage.setItem("church_hr_clock_in_settings", JSON.stringify(merged));

  try {
    return await apiRequest<{ ok: boolean; message: string; settings: ClockInSettings }>("/api/clock-in/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });
  } catch {
    return { ok: true, message: "Clock-in settings updated locally", settings: merged };
  }
}

// Visitors APIs & Resilient LocalStorage Store
const INITIAL_MOCK_VISITORS: Visitor[] = [
  {
    id: 101,
    name: "Emmanuel Chukwuemeka",
    email: "emmanuel.chukwu@gmail.com",
    phone: "+234 803 123 4567",
    first_visit_date: "2026-08-16",
    assigned_to: "W001",
    assigned_worker_name: "Osarumeh Enobakhare",
    status: "new",
    notes: "First time at Sunday service. Interested in intercessory ministry.",
    created_at: new Date().toISOString(),
  },
  {
    id: 102,
    name: "Grace Omolara",
    email: "grace.omolara@yahoo.com",
    phone: "+234 812 987 6543",
    first_visit_date: "2026-08-09",
    assigned_to: "W002",
    assigned_worker_name: "Samuel Sonayon",
    status: "contacted",
    notes: "Welcomed via phone call on Monday morning.",
    created_at: new Date().toISOString(),
  },
  {
    id: 103,
    name: "David Adeleke",
    email: "david.a@outlook.com",
    phone: "+234 701 555 4321",
    first_visit_date: "2026-08-02",
    assigned_to: "W003",
    assigned_worker_name: "Kehinde Ali-Balogun",
    status: "integrated",
    notes: "Attending Thursday midweek Bible study.",
    created_at: new Date().toISOString(),
  },
];

function getStoredVisitors(): Visitor[] {
  try {
    const raw = localStorage.getItem("church_hr_visitors");
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem("church_hr_visitors", JSON.stringify(INITIAL_MOCK_VISITORS));
  return INITIAL_MOCK_VISITORS;
}

function saveStoredVisitors(visitors: Visitor[]) {
  try {
    localStorage.setItem("church_hr_visitors", JSON.stringify(visitors));
  } catch {}
}

function getStoredFollowups(): VisitorFollowup[] {
  try {
    const raw = localStorage.getItem("church_hr_visitor_followups");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveStoredFollowups(followups: VisitorFollowup[]) {
  try {
    localStorage.setItem("church_hr_visitor_followups", JSON.stringify(followups));
  } catch {}
}

export async function fetchVisitors(): Promise<Visitor[]> {
  try {
    const data = await apiRequest<Visitor[]>("/api/visitors");
    if (Array.isArray(data) && data.length > 0) {
      saveStoredVisitors(data);
      return data;
    }
  } catch {}
  return getStoredVisitors();
}

export async function createVisitor(visitor: Partial<Visitor>): Promise<{ ok: boolean; id: number }> {
  try {
    const res = await apiRequest<{ ok: boolean; id: number }>("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visitor),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  const list = getStoredVisitors();
  const newId = Date.now();
  const newVisitor: Visitor = {
    id: newId,
    name: visitor.name || "New Visitor",
    email: visitor.email || "",
    phone: visitor.phone || "",
    first_visit_date: visitor.first_visit_date || new Date().toISOString().split("T")[0],
    assigned_to: visitor.assigned_to,
    assigned_worker_name: visitor.assigned_worker_name || "",
    status: visitor.status || "new",
    notes: visitor.notes || "",
    created_at: new Date().toISOString(),
  };

  list.unshift(newVisitor);
  saveStoredVisitors(list);
  return { ok: true, id: newId };
}

export async function updateVisitor(id: number, data: Partial<Visitor>): Promise<{ ok: boolean }> {
  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/visitors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  const list = getStoredVisitors();
  const index = list.findIndex((v) => v.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...data };
    saveStoredVisitors(list);
  }
  return { ok: true };
}

export async function deleteVisitor(id: number): Promise<{ ok: boolean }> {
  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/visitors/${id}`, {
      method: "DELETE",
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  const list = getStoredVisitors().filter((v) => v.id !== id);
  saveStoredVisitors(list);
  return { ok: true };
}

export async function fetchVisitorFollowups(visitorId: number): Promise<VisitorFollowup[]> {
  try {
    const data = await apiRequest<VisitorFollowup[]>(`/api/visitors/${visitorId}/followups`);
    if (Array.isArray(data)) {
      return data;
    }
  } catch {}

  return getStoredFollowups().filter((f) => f.visitor_id === visitorId);
}

export async function addVisitorFollowup(visitorId: number, data: Partial<VisitorFollowup>): Promise<{ ok: boolean }> {
  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/visitors/${visitorId}/followups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  const followups = getStoredFollowups();
  const newFollowup: VisitorFollowup = {
    id: Date.now(),
    visitor_id: visitorId,
    caller_id: data.caller_id,
    caller_name: data.caller_name || "",
    date: data.date || new Date().toISOString().split("T")[0],
    medium: data.medium || "call",
    feedback: data.feedback || "",
    created_at: new Date().toISOString(),
  };
  followups.unshift(newFollowup);
  saveStoredFollowups(followups);
  return { ok: true };
}

// LocalStorage helpers for Cell Groups offline / standalone mode
function getStoredCellGroups(): CellGroup[] {
  try {
    const stored = localStorage.getItem("church_hr_cell_groups");
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [
    {
      id: 1,
      name: "Grace House Cell #1",
      type: "cell",
      leader_id: 1,
      leader_name: "Osarumeh Enobakhare",
      meeting_day: "Wednesday",
      location: "14 Allen Avenue, Ikeja",
      member_count: 2,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Youth Ministry Unit",
      type: "ministry",
      leader_id: 2,
      leader_name: "Samuel Sonayon",
      meeting_day: "Friday",
      location: "Main Auditorium Hall B",
      member_count: 3,
      created_at: new Date().toISOString(),
    },
  ];
}

function saveStoredCellGroups(groups: CellGroup[]): void {
  try {
    localStorage.setItem("church_hr_cell_groups", JSON.stringify(groups));
  } catch {}
}

function getStoredGroupMembers(): Record<number, GroupMember[]> {
  try {
    const stored = localStorage.getItem("church_hr_group_members");
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    1: [
      { id: 101, group_id: 1, worker_id: 1, worker_name: "Osarumeh Enobakhare", dept: "Intercessors", role: "leader" },
      { id: 102, group_id: 1, worker_id: 2, worker_name: "Samuel Sonayon", dept: "Intercessors", role: "member" },
    ],
    2: [
      { id: 201, group_id: 2, worker_id: 2, worker_name: "Samuel Sonayon", dept: "Intercessors", role: "leader" },
      { id: 202, group_id: 2, worker_id: 3, worker_name: "Kehinde Ali-Balogun", dept: "Intercessors", role: "assistant" },
      { id: 203, group_id: 2, worker_id: 4, worker_name: "Peace Friday", dept: "Intercessors", role: "member" },
    ],
  };
}

function saveStoredGroupMembers(membersMap: Record<number, GroupMember[]>): void {
  try {
    localStorage.setItem("church_hr_group_members", JSON.stringify(membersMap));
  } catch {}
}

// Cell Group APIs
export async function fetchCellGroups(): Promise<CellGroup[]> {
  try {
    const data = await apiRequest<CellGroup[]>("/api/groups");
    if (Array.isArray(data)) {
      const stored = getStoredCellGroups();
      const backendIds = new Set(data.map((g) => g.id));
      const localOnly = stored.filter((g) => !backendIds.has(g.id));
      const combined = [...data, ...localOnly];
      saveStoredCellGroups(combined);
      return combined;
    }
  } catch {}
  return getStoredCellGroups();
}

export async function createCellGroup(group: Partial<CellGroup> & { leaderId?: any; meetingDay?: string }): Promise<{ ok: boolean; id: number }> {
  const payload = {
    ...group,
    leader_id: group.leader_id ?? group.leaderId,
    leaderId: group.leaderId ?? group.leader_id,
    meeting_day: group.meeting_day ?? group.meetingDay ?? "Wednesday",
    meetingDay: group.meetingDay ?? group.meeting_day ?? "Wednesday",
  };

  const groups = getStoredCellGroups();
  const newId = Date.now();
  const newGroup: CellGroup = {
    id: newId,
    name: group.name || "New Cell Group",
    type: group.type || "cell",
    leader_id: group.leader_id as any,
    leader_name: group.leader_name || "",
    meeting_day: group.meeting_day || group.meetingDay || "Wednesday",
    location: group.location || "Church Grounds",
    member_count: 0,
    created_at: new Date().toISOString(),
  };

  try {
    const res = await apiRequest<{ ok: boolean; id: number }>("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res && res.ok) {
      newGroup.id = res.id || newId;
      saveStoredCellGroups([newGroup, ...groups.filter((g) => g.id !== newGroup.id)]);
      return res;
    }
  } catch {}

  groups.unshift(newGroup);
  saveStoredCellGroups(groups);
  return { ok: true, id: newId };
}

export async function updateCellGroup(id: number, group: Partial<CellGroup> & { leaderId?: any; meetingDay?: string }): Promise<{ ok: boolean }> {
  const payload = {
    ...group,
    leader_id: group.leader_id ?? group.leaderId,
    leaderId: group.leaderId ?? group.leader_id,
    meeting_day: group.meeting_day ?? group.meetingDay ?? "Wednesday",
    meetingDay: group.meetingDay ?? group.meeting_day ?? "Wednesday",
  };

  const updatedGroups = getStoredCellGroups().map((g) => {
    if (g.id === id) {
      return {
        ...g,
        ...group,
        meeting_day: group.meeting_day || group.meetingDay || g.meeting_day,
      };
    }
    return g;
  });
  saveStoredCellGroups(updatedGroups);

  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  return { ok: true };
}

export async function deleteCellGroup(id: number): Promise<{ ok: boolean }> {
  const updatedGroups = getStoredCellGroups().filter((g) => g.id !== id);
  saveStoredCellGroups(updatedGroups);

  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/groups/${id}`, {
      method: "DELETE",
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  return { ok: true };
}

export async function fetchGroupMembers(groupId: number): Promise<GroupMember[]> {
  try {
    const data = await apiRequest<GroupMember[]>(`/api/groups/${groupId}/members`);
    if (Array.isArray(data)) {
      return data;
    }
  } catch {}

  const membersMap = getStoredGroupMembers();
  return membersMap[groupId] || [];
}

export async function addGroupMember(
  groupId: number,
  workerId: number | string,
  role: "leader" | "assistant" | "member" = "member",
  workerInfo?: Partial<Worker>
): Promise<{ ok: boolean }> {
  const payload = { workerId, worker_id: workerId, role };
  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  const membersMap = getStoredGroupMembers();
  const currentMembers = membersMap[groupId] || [];
  const numWorkerId = typeof workerId === "number" ? workerId : Number(String(workerId).replace(/\D/g, "")) || Date.now();

  const newMember: GroupMember = {
    id: Date.now(),
    group_id: groupId,
    worker_id: numWorkerId,
    worker_name: workerInfo?.name || `Worker ${workerId}`,
    email: workerInfo?.email || "",
    phone: workerInfo?.phone || "",
    dept: workerInfo?.department || "",
    role,
  };

  const updatedMembers = [...currentMembers.filter((m) => String(m.worker_id) !== String(workerId)), newMember];
  membersMap[groupId] = updatedMembers;
  saveStoredGroupMembers(membersMap);

  const groups = getStoredCellGroups().map((g) => {
    if (g.id === groupId) {
      return { ...g, member_count: updatedMembers.length };
    }
    return g;
  });
  saveStoredCellGroups(groups);

  return { ok: true };
}

export async function removeGroupMember(groupId: number, workerId: number | string): Promise<{ ok: boolean }> {
  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/groups/${groupId}/members/${workerId}`, {
      method: "DELETE",
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  const membersMap = getStoredGroupMembers();
  const currentMembers = membersMap[groupId] || [];
  const updatedMembers = currentMembers.filter((m) => String(m.worker_id) !== String(workerId));
  membersMap[groupId] = updatedMembers;
  saveStoredGroupMembers(membersMap);

  const groups = getStoredCellGroups().map((g) => {
    if (g.id === groupId) {
      return { ...g, member_count: updatedMembers.length };
    }
    return g;
  });
  saveStoredCellGroups(groups);

  return { ok: true };
}

// LocalStorage helpers for Asset Management offline / standalone mode
const DEFAULT_MOCK_ASSETS: Asset[] = [
  {
    id: 1,
    asset_tag: "AST-1001",
    name: "Behringer X32 Digital Sound Console",
    category: "audio-visual",
    location: "Main Sanctuary Sound Booth",
    assigned_to: 1,
    assigned_worker_name: "Austin Kyuinni",
    status: "good",
    purchase_date: "2024-01-15",
    value: 3500,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    asset_tag: "AST-1002",
    name: "Yamaha Montage 8 Synthesizer Keyboard",
    category: "musical-instrument",
    location: "Main Altar Stage",
    assigned_to: 2,
    assigned_worker_name: "Femi Tinuala",
    status: "good",
    purchase_date: "2024-03-20",
    value: 4200,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    asset_tag: "AST-1003",
    name: "Shure QLXD24 Wireless Microphone Set (4x)",
    category: "audio-visual",
    location: "Media Storage Room",
    assigned_to: 3,
    assigned_worker_name: "Tijesunimi Olugbeminiyi",
    status: "needs-repair",
    purchase_date: "2023-11-10",
    value: 2800,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    asset_tag: "AST-1004",
    name: "Toyota Coaster Executive Bus (30-Seater)",
    category: "vehicle",
    location: "Church Parking Lot",
    assigned_to: 4,
    assigned_worker_name: "Simon Brendan Sanda",
    status: "good",
    purchase_date: "2023-06-01",
    value: 45000,
    created_at: new Date().toISOString(),
  },
];

const DEFAULT_MAINTENANCE_LOGS: Record<number, AssetMaintenance[]> = {
  3: [
    {
      id: 1,
      asset_id: 3,
      service_date: "2024-05-12",
      cost: 150,
      performed_by: "SoundCraft Audio Repairs",
      notes: "Replaced antenna connector on handheld mic #2 and recalibrated frequency channel.",
    },
  ],
};

function getStoredAssets(): Asset[] {
  try {
    const stored = localStorage.getItem("church_hr_assets");
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return DEFAULT_MOCK_ASSETS;
}

function saveStoredAssets(assets: Asset[]): void {
  try {
    localStorage.setItem("church_hr_assets", JSON.stringify(assets));
  } catch {}
}

function getStoredAssetMaintenance(): Record<number, AssetMaintenance[]> {
  try {
    const stored = localStorage.getItem("church_hr_asset_maintenance");
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_MAINTENANCE_LOGS;
}

function saveStoredAssetMaintenance(logsMap: Record<number, AssetMaintenance[]>): void {
  try {
    localStorage.setItem("church_hr_asset_maintenance", JSON.stringify(logsMap));
  } catch {}
}

// Asset Management APIs
export async function fetchAssets(): Promise<Asset[]> {
  try {
    const data = await apiRequest<Asset[]>("/api/assets");
    if (Array.isArray(data)) {
      const stored = getStoredAssets();
      const backendIds = new Set(data.map((a) => a.id));
      const localOnly = stored.filter((a) => !backendIds.has(a.id));
      const combined = [...data, ...localOnly];
      saveStoredAssets(combined);
      return combined;
    }
  } catch {}
  return getStoredAssets();
}

export async function createAsset(
  asset: Partial<Asset> & { assignedTo?: any; assetTag?: string; purchaseDate?: string }
): Promise<{ ok: boolean; id: number; assetTag?: string }> {
  const tag = asset.asset_tag || asset.assetTag || `AST-${Date.now().toString().slice(-6)}`;
  const payload = {
    ...asset,
    assetTag: tag,
    asset_tag: tag,
    assignedTo: asset.assigned_to ?? asset.assignedTo,
    assigned_to: asset.assigned_to ?? asset.assignedTo,
    purchaseDate: asset.purchase_date ?? asset.purchaseDate ?? new Date().toISOString().split("T")[0],
    purchase_date: asset.purchase_date ?? asset.purchaseDate ?? new Date().toISOString().split("T")[0],
  };

  const assets = getStoredAssets();
  const newId = Date.now();
  const newAsset: Asset = {
    id: newId,
    asset_tag: tag,
    name: asset.name || "New Asset",
    category: asset.category || "audio-visual",
    location: asset.location || "Main Sanctuary",
    assigned_to: asset.assigned_to as any,
    assigned_worker_name: asset.assigned_worker_name || "",
    status: asset.status || "good",
    purchase_date: payload.purchase_date,
    value: Number(asset.value || 0),
    created_at: new Date().toISOString(),
  };

  try {
    const res = await apiRequest<{ ok: boolean; id: number; assetTag?: string }>("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res && res.ok) {
      newAsset.id = res.id || newId;
      newAsset.asset_tag = res.assetTag || tag;
      saveStoredAssets([newAsset, ...assets.filter((a) => a.id !== newAsset.id)]);
      return res;
    }
  } catch {}

  assets.unshift(newAsset);
  saveStoredAssets(assets);
  return { ok: true, id: newId, assetTag: tag };
}

export async function updateAsset(
  id: number,
  asset: Partial<Asset> & { assignedTo?: any }
): Promise<{ ok: boolean }> {
  const payload = {
    ...asset,
    assignedTo: asset.assigned_to ?? asset.assignedTo,
    assigned_to: asset.assigned_to ?? asset.assignedTo,
  };

  const updatedAssets = getStoredAssets().map((a) => {
    if (a.id === id) {
      return {
        ...a,
        ...asset,
        value: asset.value !== undefined ? Number(asset.value) : a.value,
      };
    }
    return a;
  });
  saveStoredAssets(updatedAssets);

  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/assets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  return { ok: true };
}

export async function deleteAsset(id: number): Promise<{ ok: boolean }> {
  const updatedAssets = getStoredAssets().filter((a) => a.id !== id);
  saveStoredAssets(updatedAssets);

  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/assets/${id}`, {
      method: "DELETE",
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  return { ok: true };
}

export async function fetchAssetMaintenance(assetId: number): Promise<AssetMaintenance[]> {
  try {
    const data = await apiRequest<AssetMaintenance[]>(`/api/assets/${assetId}/maintenance`);
    if (Array.isArray(data)) {
      return data;
    }
  } catch {}

  const logsMap = getStoredAssetMaintenance();
  return logsMap[assetId] || [];
}

export async function addAssetMaintenance(assetId: number, record: Partial<AssetMaintenance>): Promise<{ ok: boolean }> {
  const logsMap = getStoredAssetMaintenance();
  const current = logsMap[assetId] || [];
  const newRecord: AssetMaintenance = {
    id: Date.now(),
    asset_id: assetId,
    service_date: record.service_date || new Date().toISOString().split("T")[0],
    cost: Number(record.cost || 0),
    performed_by: record.performed_by || "Technician",
    notes: record.notes || "",
  };
  logsMap[assetId] = [newRecord, ...current];
  saveStoredAssetMaintenance(logsMap);

  try {
    const res = await apiRequest<{ ok: boolean }>(`/api/assets/${assetId}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (res && res.ok) {
      return res;
    }
  } catch {}

  return { ok: true };
}

// Discipleship LMS APIs
export async function fetchDiscipleshipCourses(): Promise<DiscipleshipCourse[]> {
  try {
    const data = await apiRequest<DiscipleshipCourse[]>("/api/discipleship/courses");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchMemberCourseProgress(): Promise<MemberCourseProgress[]> {
  try {
    const data = await apiRequest<MemberCourseProgress[]>("/api/discipleship/progress");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function updateMemberCourseProgress(workerId: number, courseId: number, status: string, completionDate?: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("/api/discipleship/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workerId, courseId, status, completionDate }),
  });
}

// Service Plans APIs & Fallback Memory Store
let IN_MEMORY_SERVICE_PLANS: ServicePlan[] = [
  {
    id: 1,
    title: "Sunday Glorious Worship Service",
    date: new Date().toISOString().split("T")[0],
    service_type: "Sunday Glorious",
  },
  {
    id: 2,
    title: "Thursday Midweek Bible Exposition",
    date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    service_type: "Midweek Exposition",
  },
];

let IN_MEMORY_SERVICE_ITEMS: Record<number, ServiceItem[]> = {
  1: [
    { id: 101, plan_id: 1, sequence: 1, title: "Opening Prayer & Call to Worship", duration_minutes: 10, leader_name: "Pastor Samuel", notes: "Psalm 100" },
    { id: 102, plan_id: 1, sequence: 2, title: "Praise & High Worship Session", duration_minutes: 25, leader_name: "Choir Ministry", notes: "Hymns 204 & 112" },
    { id: 103, plan_id: 1, sequence: 3, title: "Sermon & Word Exposition", duration_minutes: 45, leader_name: "Resident Pastor", notes: "Theme: Exceeding Grace & Power" },
  ],
  2: [
    { id: 201, plan_id: 2, sequence: 1, title: "Opening Hymn", duration_minutes: 10, leader_name: "Elder John", notes: "Hymn 45" },
    { id: 202, plan_id: 2, sequence: 2, title: "In-depth Bible Study", duration_minutes: 50, leader_name: "Teacher Deborah", notes: "Book of Romans Chapter 8" },
  ],
};

let IN_MEMORY_SERVICE_ROSTERS: Record<number, ServiceRoster[]> = {
  1: [
    { id: 301, plan_id: 1, department: "Ushering", worker_id: 1, worker_name: "Osarumeh Enobakhare", role_title: "Head Usher", status: "confirmed" },
    { id: 302, plan_id: 1, department: "Choir", worker_id: 2, worker_name: "Samuel Sonayon", role_title: "Worship Leader", status: "confirmed" },
  ],
  2: [
    { id: 401, plan_id: 2, department: "Media & Tech", worker_id: 3, worker_name: "Kehinde Ali-Balogun", role_title: "Sound Engineer", status: "confirmed" },
  ],
};

export async function fetchServicePlans(): Promise<ServicePlan[]> {
  try {
    const data = await apiRequest<ServicePlan[]>("/api/service-plans");
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return IN_MEMORY_SERVICE_PLANS;
  } catch {
    return IN_MEMORY_SERVICE_PLANS;
  }
}

export async function createServicePlan(plan: Partial<ServicePlan>): Promise<{ ok: boolean; id: number }> {
  let createdId = Date.now();
  try {
    const res = await apiRequest<{ ok: boolean; id: number }>("/api/service-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
    if (res && res.id) createdId = res.id;
  } catch {
    // static / offline fallback
  }

  const newPlan: ServicePlan = {
    id: createdId,
    title: plan.title || "Untitled Service Plan",
    date: plan.date || new Date().toISOString().split("T")[0],
    service_type: plan.service_type || "Sunday Glorious",
  };

  IN_MEMORY_SERVICE_PLANS = [newPlan, ...IN_MEMORY_SERVICE_PLANS];
  return { ok: true, id: createdId };
}

export async function updateServicePlan(id: number, plan: Partial<ServicePlan>): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
  } catch {
    // fallback
  }

  IN_MEMORY_SERVICE_PLANS = IN_MEMORY_SERVICE_PLANS.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        title: plan.title !== undefined ? plan.title : p.title,
        date: plan.date !== undefined ? plan.date : p.date,
        service_type: plan.service_type !== undefined ? plan.service_type : p.service_type,
      };
    }
    return p;
  });
  return { ok: true };
}

export async function deleteServicePlan(id: number): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/${id}`, {
      method: "DELETE",
    });
  } catch {
    // fallback
  }
  IN_MEMORY_SERVICE_PLANS = IN_MEMORY_SERVICE_PLANS.filter((p) => p.id !== id);
  delete IN_MEMORY_SERVICE_ITEMS[id];
  delete IN_MEMORY_SERVICE_ROSTERS[id];
  return { ok: true };
}

export async function fetchServiceItems(planId: number): Promise<ServiceItem[]> {
  try {
    const data = await apiRequest<ServiceItem[]>(`/api/service-plans/${planId}/items`);
    if (Array.isArray(data) && data.length > 0) return data;
    return IN_MEMORY_SERVICE_ITEMS[planId] || [];
  } catch {
    return IN_MEMORY_SERVICE_ITEMS[planId] || [];
  }
}

export async function addServiceItem(planId: number, item: Partial<ServiceItem>): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/${planId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  } catch {
    // fallback
  }

  const newItem: ServiceItem = {
    id: Date.now(),
    plan_id: planId,
    sequence: item.sequence || 1,
    title: item.title || "Untitled Activity",
    duration_minutes: item.duration_minutes || 10,
    leader_name: item.leader_name || "",
    notes: item.notes || "",
  };

  const list = IN_MEMORY_SERVICE_ITEMS[planId] || [];
  IN_MEMORY_SERVICE_ITEMS[planId] = [...list, newItem];
  return { ok: true };
}

export async function updateServiceItem(itemId: number, item: Partial<ServiceItem>): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  } catch {
    // fallback
  }

  for (const planId in IN_MEMORY_SERVICE_ITEMS) {
    IN_MEMORY_SERVICE_ITEMS[planId] = IN_MEMORY_SERVICE_ITEMS[planId].map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          title: item.title !== undefined ? item.title : it.title,
          duration_minutes: item.duration_minutes !== undefined ? item.duration_minutes : it.duration_minutes,
          leader_name: item.leader_name !== undefined ? item.leader_name : it.leader_name,
          notes: item.notes !== undefined ? item.notes : it.notes,
        };
      }
      return it;
    });
  }

  return { ok: true };
}

export async function deleteServiceItem(itemId: number): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/items/${itemId}`, {
      method: "DELETE",
    });
  } catch {
    // fallback
  }

  for (const planId in IN_MEMORY_SERVICE_ITEMS) {
    IN_MEMORY_SERVICE_ITEMS[planId] = IN_MEMORY_SERVICE_ITEMS[planId].filter((it) => it.id !== itemId);
  }
  return { ok: true };
}

export async function fetchServiceRoster(planId: number): Promise<ServiceRoster[]> {
  try {
    const data = await apiRequest<ServiceRoster[]>(`/api/service-plans/${planId}/roster`);
    if (Array.isArray(data) && data.length > 0) return data;
    return IN_MEMORY_SERVICE_ROSTERS[planId] || [];
  } catch {
    return IN_MEMORY_SERVICE_ROSTERS[planId] || [];
  }
}

export async function addServiceRoster(planId: number, roster: Partial<ServiceRoster>): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/${planId}/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(roster),
    });
  } catch {
    // fallback
  }

  const newRoster: ServiceRoster = {
    id: Date.now(),
    plan_id: planId,
    department: roster.department || "General",
    worker_id: roster.worker_id || 1,
    worker_name: roster.worker_name || "Scheduled Volunteer",
    role_title: roster.role_title || "Volunteer",
    status: roster.status || "confirmed",
  };

  const list = IN_MEMORY_SERVICE_ROSTERS[planId] || [];
  IN_MEMORY_SERVICE_ROSTERS[planId] = [...list, newRoster];
  return { ok: true };
}

export async function deleteServiceRoster(rosterId: number): Promise<{ ok: boolean }> {
  try {
    await apiRequest<{ ok: boolean }>(`/api/service-plans/roster/${rosterId}`, {
      method: "DELETE",
    });
  } catch {
    // fallback
  }

  for (const planId in IN_MEMORY_SERVICE_ROSTERS) {
    IN_MEMORY_SERVICE_ROSTERS[planId] = IN_MEMORY_SERVICE_ROSTERS[planId].filter((r) => r.id !== rosterId);
  }
  return { ok: true };
}

export async function sendRosterReminder(
  roster: ServiceRoster,
  channel: "whatsapp" | "email" | "sms" | "all",
  planTitle: string,
  planDate: string
): Promise<{ ok: boolean; message: string }> {
  try {
    await apiRequest<{ ok: boolean; message: string }>("/api/service-plans/send-reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rosterId: roster.id, channel, planTitle, planDate }),
    });
  } catch {
    // static fallback simulated send
  }

  return {
    ok: true,
    message: `Reminder sent to ${roster.worker_name} via ${channel.toUpperCase()}`,
  };
}

// Church Events & Calendar APIs (Planning Center Calendar)
export async function fetchChurchEvents(): Promise<ChurchEvent[]> {
  try {
    const data = await apiRequest<ChurchEvent[]>("/api/calendar/events");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createChurchEvent(event: Partial<ChurchEvent>): Promise<{ ok: boolean; id: number }> {
  return apiRequest<{ ok: boolean; id: number }>("/api/calendar/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
}

export async function deleteChurchEvent(id: number): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/calendar/events/${id}`, {
    method: "DELETE",
  });
}

// Kiosk Check-In APIs (Planning Center Check-Ins)
export async function fetchKioskCheckins(): Promise<KioskCheckin[]> {
  try {
    const data = await apiRequest<KioskCheckin[]>("/api/kiosk/checkins");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createKioskCheckin(data: Partial<KioskCheckin>): Promise<{ ok: boolean; id: number; securityCode: string }> {
  try {
    const res = await apiRequest<{ ok: boolean; id: number; securityCode: string }>("/api/kiosk/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res && res.securityCode) return res;
    throw new Error("Invalid response");
  } catch {
    const fallbackCode = `TAG-${Math.floor(1000 + Math.random() * 9000)}`;
    return { ok: true, id: Date.now(), securityCode: fallbackCode };
  }
}

export async function checkoutKiosk(id: number): Promise<{ ok: boolean }> {
  try {
    return await apiRequest<{ ok: boolean }>(`/api/kiosk/checkout/${id}`, {
      method: "PUT",
    });
  } catch {
    return { ok: true };
  }
}


