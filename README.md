# prog-2052

# Kort Beskrivelse av nettsiden
Tjenesten vår er en middagsplanlegger for grupper og familier. Målet med applikasjonen er å forenkle hverdagen for folk ved å minimere tiden de må bruke på å planlegge ukesmiddagene. Vi ønsker også å redusere misforståelser innad i familien når det kommer til måltidsplanelgging med strukturert og intuitiv funksjonalitet for å planlegge og generere måltider samt handelister for uka. Vi håper at applikasjonen vår bidrar med å redusere matsvinn.

## Hovedside
Her er det mulighet for å logge inn og registrere en bruker. All funksjonalitet på nettsiden vår krever at man er logget inn og første steget er derfor å registrere en bruker. Når du har logget inn blir du tatt til den egentlige hovedsiden som viser alle gruppene du er del i. Her kan du lage nye grupper og legge til de medlemmene du ønsker. Gruppene som vises i oversikten kan klikkes på og du vil bli tatt videre til hovedsiden for gruppen. 

## Hoved side for gruppe
Her vil du se en overikt over gruppemedlemmene. Hvis du er en administrator eller eier av gruppa vil det vises en knapp for som du kan trykke på for å gå til gruppeinstillinger. Dersom du bare er medlem av gruppa vil det isteden vises en "forlat gruppe" knapp. Under oversikten over medlemmene er det tre knapper som respektivt tar deg til måltidsplanlegger, handleliste eller chat. 

## GruppeInstillinger
Her kan eieren og administratoren redigere på gruppa. Eieren kan slette gruppa, legge til medlemmer, fjerne medlemmer, gi fra seg eierskap over gruppa og redigere rollene til andre gruppemedlemmer. Administratorer kan bare fjerne medlemmer med rollen "medlem", den kan legge til nye medlemmer og får muligheten til å forlate gruppa. 

## Chat 
Du kan navigere til chat siden enten med å bruke navigasjonsmenyen øverst, eller å gå via en gruppe i hovedsiden for den gruppen. Dersom du går via en gruppe vil gruppechatten automatisk vises i displayet på høyre side. Denne gruppechatten blir automatisk opprettet når man lager en gruppe. På venstre siden er det en liste med alle chattene du er medlem av og du kan filtrere denne listen for å enkelt gå inn på chatten du ønsker. Eieren for chatten kan redigere chatten, hjvor det er mulighet for å fjerne og legge til medlemmer. 


# Nettside endpoints:

## /
Hjemmeside

## /oppskrifter
Liste over alle oppskrifter

## /oppskrifter/oppskrift/{?id={:oppskrift_id}}
Visning av en spesifik oppskrift som kan endres på

## /kalender
Viser kalender for en uke

## /grupper
Viser info om gruppe med mulighet for å redigere for administratorer

## /handleliste
Mulighet til å se, legge til og fjerne ting fra handleliste



# API Endpoints:

## /recipe/

#### Hente oppskrift
```
 Method: GET
 Path: /recipe/{ID_til_bruker_eller_enkeltoppskrift}{?group={true}}{&single={true}}
```
Response:
```
200 - OK
Recipe
```
#### Legge til oppskrift
```
Method: POST
Path: /recipe/
Body:

``` 
Response:
```
201 - Created
id - ID for ny oppskrift
```

#### Fjerne oppskrift
```
Method: DELETE
Path: /recipe/
Body:

```

Response:
```
200 - OK
```

#### Endre oppskrift
```
Method: PATCH
Path: /recipe/
Body:

```

Response:

```
200 - OK
```


### /user/


### /group/


### /shopping/


### /image/
```
Method: POST
Path: /image/
Body: formfile "file"
```

Response:
```
200 - OK
id - ID (filnavn) til nytt bilde
```
