# prog-2052

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

## /chat
chat


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

### /clear/
```
Method: POST
Path: /clear/
Body: 
```

Response:
```
200- OK
```

### /stats/
```
Method: GET
Path: /stats/
Body:
```

Response:
```
200 - OK
Body:
{
 "numCacheHits": 0,
 "numCacheMiss": 0,
 "numGroups": 36,
 "numRecipes": 144,
 "numShopping": 7,
 "numUsers": 45
}
```
