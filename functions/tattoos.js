// Ta lista MUSI pozostać zgodna z TATTOO_GROUPS w ../index.html —
// nie ma między nimi automatycznej synchronizacji.
const TATTOO_GROUPS = [
  { group: "Wojownik", items: [
    { name: "mistrz parowania", cls: "Wojownik", desc: "Znacząco wzmacnia umiejętność parry i shield block, dodatkowo istnieje szansa na bierne parry." },
    { name: "niewzruszony obrońca", cls: "Wojownik", desc: "Wojownik pewnie stoi na ziemi i ciężko posłać go na ziemię, dodatkowo skraca czas ogłuszenia i unieruchomienia." },
    { name: "fechmistrz", cls: "Wojownik", desc: "Wzmacnia umiejętność wardance. Stan skupienia utrzymuje się także poza walką, a ucieczka zmienia się w taktyczny odwrót." },
    { name: "miażdżyciel", cls: "Wojownik", desc: "Wzmacnia umiejętność overwhelming strike. W stanie skupienia umiejętność staje się bierna." }
  ]},
  { group: "Barbarzyńca", items: [
    { name: "szaleniec", cls: "Barbarzyńca", desc: "Znacząco wydłuża czas działania i wzmacnia działanie umiejętności berserk." },
    { name: "rębacz", cls: "Barbarzyńca", desc: "Wzmacnia umiejętność charge, szansę na wywrócenie przeciwnika oraz daje możliwość użycia umiejętności podczas tankowania." },
    { name: "wirująca zagłada", cls: "Barbarzyńca", desc: "Wzmacnia umiejętność whirlwind oraz daje jej szansę na bierne użycie." },
    { name: "przytłaczające ataki", cls: "Barbarzyńca", desc: "Pozwala używać przytłaczających ataków (might blows) w trybie automatycznym. Berserkowanie podtrzymuje ten stan." }
  ]},
  { group: "Paladyn", items: [
    { name: "święty wojownik", cls: "Paladyn", desc: "Daje dostęp do piątego kręgu wraz z czarami sanctuary, divine power oraz consecrate." },
    { name: "obrońca wiary", cls: "Paladyn", desc: "Wzmacnia umiejętności obronne." }
  ]},
  { group: "Kleryk", items: [
    { name: "wybraniec bogów", cls: "Kleryk", desc: "Znacznie wzmacnia czary leczące." },
    { name: "bitewne przeszkolenie", cls: "Kleryk", desc: "Wzmacnia możliwości bojowe kapłana, dodatkowo podczas walki ma szansę na odzyskanie rzuconego czaru." }
  ]},
  { group: "Mag", items: [
    { name: "mistrz zaklęć", cls: "Mag", desc: "Ma wpływ na przebicie odporności i siłę rzucanych czarów, dodatkowo podczas walki ma szansę na odzyskanie rzuconego czaru." }
  ]},
  { group: "Druid", items: [
    { name: "obrońca natury", cls: "Druid", desc: "Umożliwia rzucanie czarów podczas posiadania szponów oraz daje dostęp do czaru nature ally IV." },
    { name: "drzewko szczęścia", cls: "Druid", desc: "Czyni każde miejsce przyjaznym dla druida." },
    { name: "zmiennokształtny", cls: "Druid", desc: "Wzmacnia przemiany druida oraz pozwala używać zaklęć w zwierzęcej formie." },
    { name: "przyczajony łowca", cls: "Druid", desc: "Pantera zawsze szuka cienia, aby się przyczaić." },
    { name: "wilczy skowyt", cls: "Druid", desc: "Wilk może użyć więcej niż jednego wilczego wycia w danym czasie." },
    { name: "taran", cls: "Druid", desc: "Podczas tratowania niedźwiedź może powalić znacznie większego przeciwnika." }
  ]},
  { group: "Złodziej", items: [
    { name: "cień", cls: "Złodziej", desc: "Podczas działania sneaka złodziej automatycznie się ukrywa, wykorzystując swoją umiejętność hide." },
    { name: "mistrz zamków", cls: "Złodziej", desc: "Od poziomu mistrzowskiego wzmacnia umiejętność otwierania zamków w skrzyniach, omija wszelkie blokady." },
    { name: "mistrz uników", cls: "Złodziej", desc: "Wzmacnia umiejętność dodge oraz daje jej szansę na bierne użycie." },
    { name: "cios śmierci", cls: "Złodziej", desc: "Znacząco zwiększa zabójcze umiejętności złodzieja." },
    { name: "wachlarz ostrzy", cls: "Złodziej", desc: "Podczas używania uników złodziej ma szansę na bierne użycie bladesplash na przeciwniku, którego ataku uniknął." }
  ]},
  { group: "Czarny Rycerz", items: [
    { name: "twardy blok", cls: "Czarny Rycerz", desc: "Daje dostęp do umiejętności shield block na 31 poziomie." },
    { name: "władca marionetek", cls: "Czarny Rycerz", desc: "Wzmacnia czas kontrolowania nieumarłych i avatara niemal bez końca." }
  ]},
  { group: "Nekromanta, Czarny Rycerz", items: [
    { name: "nieumarły", cls: "Nekromanta, Czarny Rycerz", desc: "Przemiana w nieumarłą istotę." }
  ]},
  { group: "Nomad", items: [
    { name: "tancerz", cls: "Nomad", desc: "Umożliwia zmianę stylu walki bladefury/bladedance w trakcie walki." },
    { name: "wirujące ostrza", cls: "Nomad", desc: "Wzmacnia umiejętność cyclone oraz daje jej szansę na bierne użycie." },
    { name: "piaski pustyni", cls: "Nomad", desc: "Czyni każde miejsce przyjaznym dla nomada." },
    { name: "taneczny krok", cls: "Nomad", desc: "Nomad nieprzerwanie pozostaje w swoim tanecznym transie, ale wie, kiedy zejść z parkietu niepokonanym." }
  ]},
  { group: "Wędrowiec", items: [
    { name: "grabieżca", cls: "Wędrowiec", desc: "Zwiększa szansę na odkrycie nietypowych łupów w plądrowanych ciałach." }
  ]},
  { group: "Triki specjalne", items: [
    { name: "oko cyklonu", cls: "Trick: cyclone", desc: "Zwiększa szansę na trick." },
    { name: "łowca niewolników", cls: "Trick: entwine", desc: "Zwiększa szansę na trick." },
    { name: "między młotem a kowadłem", cls: "Trick: thundering whack", desc: "Zwiększa szansę na trick." }
  ]},
  { group: "Wszystkie klasy", items: [
    { name: "charyzmatyczny przywódca", cls: "Wszystkie klasy", desc: "Umożliwia wydanie rozkazu wszystkim podwładnym za jednym razem — order all." },
    { name: "pakt ze śmiercią", cls: "Wszystkie klasy", desc: "Pan śmierci czasem odwraca wzrok, co czyni śmierć znacznie przyjemniejszą." },
    { name: "myto ogarów", cls: "Wszystkie klasy", desc: "Opłacone myto (trzeba mieć przy sobie gotówkę) daje szansę na zachowanie części ekwipunku przy śmierci. Nie działa w PvP." },
    { name: "bezpieczny skarbiec", cls: "Wszystkie klasy", desc: "Daje szansę na zachowanie części ekwipunku przy śmierci. Nie działa w PvP." },
    { name: "głębokie kieszenie", cls: "Wszystkie klasy", desc: "Podczas plądrowania zwłok rabuś może coś przeoczyć — daje szansę na zachowanie części ekwipunku przy śmierci. Nie działa w PvP." }
  ]}
];

const FLAT = [];
TATTOO_GROUPS.forEach((g) => g.items.forEach((it) => FLAT.push(it)));

const RUNE_COLORS = [
  { key: "celnosc", label: "Celność (niebieska)" },
  { key: "obrona", label: "Obrona (biała)" },
  { key: "umysl", label: "Umysł (zielona)" },
  { key: "zniszczenie", label: "Zniszczenie (czerwona)" }
];

module.exports = { TATTOO_GROUPS, FLAT, RUNE_COLORS };
