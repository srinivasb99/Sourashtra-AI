import { useState, useRef, useCallback, useEffect } from 'react';
import API_URL from '../config/api';

// Gemini Live API hook using @google/genai SDK
// Connects via Firebase Functions for secure API key management

const SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// Sourashtra AI System Instruction for Voice Mode (English)
// IMPORTANT: Keep this SHORT - large system instructions cause "invalid argument" errors with Live API
// The full dictionary is accessed via function calling (lookup_sourashtra_word, get_category_words)
const VOICE_SYSTEM_INSTRUCTION = `You are a Sourashtra language assistant. You MUST use the lookup_sourashtra_word tool for ALL translation questions.

MANDATORY RULES:
1. For ANY word/translation question: CALL lookup_sourashtra_word FIRST, then speak
2. NEVER guess Sourashtra words from your training - it is WRONG
3. Use the EXACT sourashtra/english from tool results
4. If found=false, say "That word isn't in my dictionary"
5. If matchType="phonetic", tell user: "I found [word] which sounds similar"
6. When user says a Sourashtra word, look it up to verify before responding

IF YOU DO NOT USE TOOL CALL FIRST, YOU WILL BE FIRED. AND TERMINATED.

Example flow:
User: "what is ant" -> Call lookup_sourashtra_word(word="ant") -> Result: sourashtra="mingi" -> Say "Ant is 'mingi'"
User: "what about bho" -> Call lookup_sourashtra_word(word="bho") -> Result shows phonetic match to "bO"="Father" -> Say "bO means Father"

Keep responses short (1-2 sentences). Be friendly and encouraging.`;

// Full Sourashtra dictionary data - loaded separately, not in system instruction
// This can be used for reference but should NOT be included in the Live API config
const SOURASHTRA_DICTIONARY_RAW = `SOURASHTRA DICTIONARY:

Body Parts - Sourashtra to English
aangu
Body
tON
Face
doLo
Eyes
naak
Nose
kaan
Ears
tON
Mouth
pavni
Eye brows
gavlo
Cheeks
chipu
Chin
roppo
Eye lash
kabaaL
Forehead
dosko
Head
khEs
Hair
geLo
Neck
ghaDi
Throat
jib
Tongue
daat
Teeth
hiriDi
Gum
maan
Back neck
khandu
Shoulder
taLo haath/moot
Palm/Fist
angiLi
Finger
khobo
Elbow
pOd
Stomach
hEm
Chest
paad
Back
kED
Hip
maDi
Thigh/Lap
gudgo
Knee
paayn
Leg
kenDo
Skin
nekku
Nail
pagul/ taLo paayn
Foot / sole
hatko
Bone
regat
Blood
hOT
Lip
huTTo
Saliva
bhombi
Navel
neram
Nerves




Body Parts - Sourashtra Sentence to English

elle morE aangu
This is my body
morE tON singaar sE
My face is beautiful
mogo doLo mhoTTo seTe. mii doLo hollo savu.
I have large eyes. I see with my eyes.
mogo oNTe naak sEtE. mii naak vaaT vasuno savu.
I have One nose. I smell with my nose.
mogo dee kaan sEtE
I have two ears.
mogo oNTe tON sEtE
I have one mouth.
morE pavni singaar sE
My eye brows are beautiful
mogo dii gavlo sEtE. morE gavlo guNDu sE
I have 2 cheeks My cheeks are round
mogo ontey chipu sEtE
I have one chin
morE roppo lambo sEtE
I have long eye lashes
mogo nhanna kabaaL sEtE
I have a small forehead
mogo oNTe dosko sEtE
I have one head
morE khEs kaaLo sEtE
My hair is black
mii morE geLaam chain tailu.
I wear chain on my neck
khaariyo ghaDim jaay. togo morey ghadi aikkaay
Food goes in the throat You hear my voice
jiib hollo ruchi savu
I taste with my tongue
daat manji
Brush your teeth
cokkaT hiriDi
Healthy gums
maan duno
Neck pain
mogo dee khaandu sEtE
I have 2 shoulders
morE haath jamaan dhellay
My hands grab/hold things
oNTe moot bhOr
One fist full
morE haathum dessu angiLi sEtE
My hands have 10 fingers
mogo morey khopo dherato musay
I can touch my elbows
morey pOdum konni nhii
My stomach is empty
hEm jaaL
heart burn
torE gudgo moLci
Fold your knee
torE paayn lambo kEr
Stretch your legs
kenDo cunDayyo
Burnt my skin
mii morE nekku heDu
I clip my nails
torE pakul thuKKi thOv / taLo paaYn jelaras
Put your step ahead / sole is burning
more hatko muTTiyo
My bone broke
regat avdiyO
Started bleeding
more hOT jeLaras
My lips are burning
mogo sego keraras
I am sweating
toNum huTTo urai
Saliva secretes in mouth
bhombi dekkaaras
The naval can be seen
neramu bolim
Strong nerves
mogo, morE paad savaanaa
I cannot see my back
mii, moreE kEDum pant tailu
I wear pants on my hip
mii amba madim inju
I sleep on my mom's lap


Body Parts - English to Sourashtra Sentence

This is my body
elle morE aangu
My face is beautiful
morE tON singaar sE
I have large eyes. I see with my eyes.
mogo doLo mhoTTo seTe. mii doLo hollo savu.
I have One nose. I smell with my nose.
mogo oNTe naak sEtE. mii naak vaaT vasuno savu.
I have two ears.
mogo dee kaan sEtE
I have one mouth.
mogo oNTe tON sEtE
My eye brows are beautiful
morE pavni singaar sE
I have 2 cheeks My cheeks are round
mogo dii gavlo sEtE. morE gavlo guNDu sE
I have one chin
mogo ontey chipu sEtE
I have long eye lashes
morE roppo lambo sEtE
I have a small forehead
mogo nhanna kabaaL sEtE
I have one head
mogo oNTe dosko sEtE
My hair is black
morE khEs kaaLo sEtE
I wear chain on my neck
mii morE geLaam chain tailu.
Food goes in the throat You hear my voice
khaariyo ghaDim jaay. togo morey ghadi aikkaay
I taste with my tongue
jiib hollo ruchi savu
Brush your teeth
daat manji
Healthy gums
cokkaT hiriDi
Neck pain
maan duno
I have 2 shoulders
mogo dee khaandu sEtE
My hands grab/hold things
morE haath jamaan dhellay
One fist full
oNTe moot bhOr
My hands have 10 fingers
morE haathum dessu angiLi sEtE
I can touch my elbows
mogo morey khopo dherato musay
My stomach is empty
morey pOdum konni nhii
heart burn
hEm jaaL
I cannot see my back
mogo, morE paad savaanaa
I wear pants on my hip
mii ket hollo pant thailu
I sleep on my mom's lap
mii amba madim inju
Fold your knee
torE gudgo moLci
Stretch your legs
torE paayn lambo kEr
Burnt my skin
kenDo cunDayyo
I clip my nails
mii morE nekku heDu
Put your step ahead / sole is burning
torE pakul thuKKi thOv / taLo paaYn jelaras
My bone broke
more hatko muTTiyo
Started bleeding
regat avdiyO
My lips are burning
more hOT jeLaras
I am sweating
mogo sego keraras
Saliva secretes in mouth
toNum huTTo urai
The naval can be seen
bhombi dekkaaras
Strong nerves
neramu bolim


Food Items

aTkul
beated flat rice
appuDaal
Fried lentil savory
aNDO
Egg
ambil
Broth or soup
Thenthulo
Torque
Thelni
Saute
Thaene
Honey
Raagh
Ashes
Odi
Fritters
Nayalpaan
Beetle Leaves






Days of the week


somaar
Monday
mongalaar
Tuesday
budaar
Wednesday
bestaar
Thursday
shukraar
Friday
senmaar
Saturday
aitaar
Sunday






Animal Names


mingi
ant
ballu
bear
jhurul
cricket
bheis
buffalo
goru
bull
kavLaghAT
eagle
lolpaDe
camel
duDo
calf
manjiri
cat
bando
cockroach
gAi
cow
kirivil
crab
kukro
crane
nakru
crocodile
kavLo
crow
kOkil
cuckoo
harin
deer
suno
dog
ghedaT
donkey
suNTi
dragonfly
bhathulo
duck
aisthu
elephant
mhaLi
fish
bhenDu
goat
kuDi
hen
saso
hare
ghoDo
horse
kiDAn
insects
jUm
lice
pAlo
lizard
simho
lion
nakhul
mongoose
kOdi
monkey
pisuLo
mosquito
phundir
mouse
ghUku
owl
ramo
parrot
mhOr
peacock
dukkar
pig
kaudu
pigeon
ghUs
rat
kuto
rooster
chADo
big black ant
vako
stork
saap
snake
MouDi
spider
vinchu
scorpion
chiDi
sparrow
ciklo
squirrel
hamso
swan
vaakh
Tiger
kasvo
tortoise
dishLo
vulture
Vukho
wolf
SaraLu
chameleon
gudval
Monitor Lizard












Nouns (Person)


male
dallO
person
jeno
Youth
javNapan
young man
javNo
Young woman
javNi
pregnancy
ghevrAr
pregnant woman
ghevrarin
virgin­
kanyA
old man
dovro
old woman
dovri
child
pillO
bachelor
kumara
unmarried girl
kumari
baby
nhuru
childhood
bAlyam
children
bALun
age
Ossu
child
pillO
husband
dallo
girl
beTki
boy
beTka
man
menik
woman
ammakkO
human
mAnusham












Directions


osto
west
khaunasu
east
uttar
north
dekSan
south


Nature Terms


akaas
sky
suritu
sun
cendAm
moon
chukko
star
mEgh
cloud
pous
rain
chinkul
drizzle
mobbu
cloudy
monchu
mist
sambu
lightning
piDuk
thunder
varo
wind
silpan
Cold-wind
gerjano
thunder
ghirAN
eclipse
sundur
Ocean
sundurukeTTo
beach
neddi
river
neddikeTTo
River-bank
lAT
wave
lOt
depth
nuruk
foam
yanu
airplane
taru
Ship
moti
pearl
dongar
mountain
Ito
swim
fhoon
sunny
fhunno
hot
siLLo
cold
sego
sweat
hIm
chill
bAnji
algae
ghirAl
fate
paTNam
Cities
kovDo
Shell


Tastes


guLLe
Sweet
ambaT
Sour
koDu
Bitter
Khaar
Spicy
ogur
Pungent
ticcan
Tasteless
komman
Raw taste / taste of unfermented curd
kenar
Stale
kerakarAte
Astringent
rucci
Taste
kheruT
Salt
tikke
Pungent


Eating Verbs


kha
Eat
pE
Drink
chemchi
chew
chAT
Lick
mingi
Swallow
chAv
Bite
jhUr
Slurp


Basic Numbers


onTe
one
Diiyo
two
theenyE
three
caarE
four
paanchE
five
sOyO
six
saatE
seven
aaTE
eight
novyo
nine
dessE
ten
viyaarE
eleven
baarE
twelve


Basic Colors


niLa
indigo
jembLa
violet
kaLa
black
lhhovva
red
shyaama
blue
polsa
green
haLduna
yellow
hira
orange
hujaaL
white
kempu
dark-red


Phonetic Words


aHam
I
ain
Maternal Grandparents
AkSepam
objection
anGiLi
Finger
aure
Ours
Av
Come here Singular
avo
Come here with respect
bhOr
Full
bOv
Call
cAv
Bite
choDDo
Robber
chomci
Chew
dhaDo
Big Entrance
dherum
Concept of Justice or Service to Others
dhULi
Dust
dori
String
eno
He / she
ET
Here
geruT
Eagle
ghAl
Serve
hET
Remove
hiir/hIr
Well
ivar
Knowledge
jAL
Burn
jhAi
To Close
kallo
Bitter Gourd
khallo
Down
khaNNo
Need to Buy
khaTo
Thorn
kiiSTu
Krishna
lAv
Apply
mhaDho
Month
moran
Death
nAv
Name
oDi
Savory
OT
Lose
pAn
Leaf
panJam
Famine
phUl
Flower
MoSAeN
Cemetry
rOT
Cry
RRegat
Blood
RumAl
handkerchief
sangi
Tell
sAstra
Tradition
SrEshTa
Excellent
tambE
An utensil
thOv
Keep it
uDit
Yellow Gram
vAT
Grind
VijnAn
Science
yeLo
Cardomom
nhA
Negative
mhaLi
Fish
lhovo
Red
rhA
Wait / Stay




Common Words - UCLA list


abbatte
obtain
ambaT
sour
angiLi
finger
Aphis
office
aTTALe
shelf
baLAr
wantonly
bencu
bench
beTki
female
beTo
son
bhagutul
singer
bhai
brother
bhajji
greens
bhiit
wall
bhonno
pot
bhounDi
daughter-in-law
bhUkh
hungry
biyAt
key
boNDi
cart
boTTo
cloth
cekki
to cut
cenno
parched Bengal grain saesoned with tumeric salt
ceTTukeri
suddenly
chekkur
wheel
chellaDam
underwear
chelmo
river spring
chowLi
jacket
chullo
oven
cokkAy
Shirt
cuNTi
pinch/compress painfully
dado
elder brother
dallo
husband
Dappo
drum
dekkaDatte
to show
dekki
to meet
devar
husband's younger brother
dhaDDe
send
dheGmbhAt
curd rice
dhoNDam
drum
dhUmpAn
tobbaco
dhuvatte
wash
dhuvATTi
spoon for fragrant incense of an offering
divA doLo
oil lamp
divoyo
second
dobbi
push
dori
thread
dorimboTTu
mangalasutra
drAkSe poLLo
grapes
fivri
turn
gALDe
scold
geLo
neck
ghaDi
throat
ghoDo
horse
goNam
skirt
gosulo
anklet
guddi
punch
guLLe
sweeter
guLLu pongal
sugar rice
hibbAT
stop
hujAL
white
jeDbulo
head ornament
jelleT
sift, sieve
jengaLam
blanket
jenJem
holy thread
jhagatte
conceal
jhago
close
jhaNNi
broom stick
jheTani
husband's elder brother's wife
jomayi
son-in-law
kaccambA poLLo
mango
kaDale
ground nut
kaDale tEl
ground nut oil
kajaeL
eyeliner
kallo
bittergoard
kApi
coffee
kavAT
door
koulo
niche
khaDo
take(formal/plural)
khajju
sore, ulcer
khaLLe
take
khAndur
shoulder
khoLTi
bag
koNDo
bran
kuDo
cock
kuDi
hen
likkaDo
make to write(formal/plural)
likko
write(formal / plural)
lubbiN
gooseberry pickles
madip
status, suspect
manJiri
cat
mhoTTappan
leadership
nadini
grand daughter
natte
grand son
nekku
nail
paTi
yarn
pAyGpoDatte
worship
peTi
box
phandare
fifteen
pharAdu
after
phirle
to wear
phonni
comb
pillo
child
piLTi
toy
podjAL
jealousy
poLi
spoon
poLLo
fruit
ponnisu poLLo
jackfruit
sangi
to say
sAT
sixty
sigir
sneeze
soLobhAr
morning
sthiram
stable
sthiti
status
tandu
rice
tappAT
boil
teTTo
plate
teTTi
knock
thAm
place
theTki
obstruct
thinvo
third
tivi
bench
tukki
carry, lift
tuNDu
towel
udhAr
loan
uttaram
girder
vangi
brinjAl
vikku
poison
vinchu
scorpion
vinkar
weaver


Feelings
sompu
happy
dhaak
Fear
vicaar
Sad
raak
Anger
rOD
Cry
praamo
Love
sUt
Crave
aNcullE
Control
bharaaT sOT
Let out
podjaaL
Jealousy
siin
Tired
eNkijaatE
Humble
baado
Difficulty
dukku
Sorrow
geruv
Proud
moNkatE
Grumble
Hagur
Greed
raaji pOD
Fall in love
monnu dunO
Hurt
hankaar
Wrath
kamcatE
Fabricate
veTTi vatO
Blabber
kheni gavatE
Reel
himco
Torture
soDi dhEr
Give in
tondarav
Tease
nustovatO
Empty words
vambudimbu
Adamant
sOT
Let go
haath dhuuv
abandon
jeNDi
Brute
sigaNDi
Hard
nishTur vato
Sarcastic
cheDaav
Arrogant


House Hold Words


ghEr
House
tavram
Kitchen
handavu bhittar
Inside the Kitchen
aro
Store room
pankho
Fan
vijano
Fan
divo
Lamp
bhoy~
Floor
gheDigaLo
Clock
tivi
Bench
hoDAr
Atrium
poSaen
Verandha
viddEr
Upstairs
Khallo
Downstairs
paDi
Step
viddemerkaNi
stairs
maLo
Toilet
geDighaNo
Garage
biiro
Cupboard
veLividdE
Terrace
hunjaLo
Swing
jhaNNi
Broom
kuppaateTTo
Garbage pan
aTTALe
Shelf
teTTu
Berth
phonni
Comb
phuTki
Basket
kaNNaDi
Mirror
aYino
Mirror
nevDo
Foyer
hodaar
Foyer
hoLTo
Front porch
ghErkeri
Landlord
ghErkerin
Landlady
ghommo
Home
deDi
Partition
viDgiNE
Brick
valgiNNi
Balcony
keraadikavaad
Metal gate
telkaT
Pillow
kambiLi
woolen Blanket
pOrvO
Thin Blanket
cevini
Slippers
darumburo
Step at the entrance
koLAi
Tap
chaki
grinding stone
vaaLi
Bucket
kuDo
Pail
badalgiDi
Fisher tool
geTpaaro
Digger
mammaTTi
spade
karanDi
Utensil
hogaL
Grinding stone
PaDo
Flat stone
vorgulo
Rotating stone
musaL
Pounder
tUmbo
Drain
kanjimbhonno
Traditional pot
chullo
Stove
miTTo
Step
haNDo
Large Utensil
deLam
Floor
KhiLo
Hook
khiiL
Lock
bigAet
Key
peDi
Suitcase
suruk
Drawer
akaasuDi
Sun roof
paskaTkavaaT
Backdoor
khoTTo
Hall
nelE
The entrance frame
thoLchammA miTTo
Altar at the atrium
nagal
copy
dEvughoulo
Small altar
pujAe thavram
Prayer room
vaaT saarvo
Pathway
toTti
Water tub
senduvaaT
Alley
hiirukkeTTo
wall of the well
viddErutauram
Upstairs room


Adjectives


kaLo poLLo
Black fruit
phaNTa khes
Blond hair
hujaal cokkai
White shirt
mettan tundu
Soft towel
kacce poLLo
Unripe fruit
pikke poLLo
Ripe fruit
raaNu bheys
Wild ox
singaar phool
Beautiful flower
ruccikan bhaat
Tasty rice
guLLe viNaay
Sweet Ganesha
guDDe adushTu
Blind luck
turkke naLer
Shredded coconut
sijje beLo
Cooked lentil
solae kuDi
Unfeathered chicken
gheTTi amTi
Thick soup
tikke caTni
Spicy chutney
hunno sambaar
Hot sambar
phuTTe ghaDi
Broken or mature teen voice
lambu neddi
Long River
phuTTe peDi
Broken box


Pronouns - SourashtraDictionary.com


kOn
Who
mii
I
tuu
You
ami
We
tumi
You
yeno
He
teno
He
enu
They (here)
tenu
They
askitenu
Everyone
kolle
Which
elle
This
telle
That
more
My
tore
Your
apul
His
avre
Our
auryo
Our
ture
Your
apulaan
Their
kongo
To Whom
mogo
To me
togo
To you
aunko
To us
tunko
To you (plural)
ego
To him/her (here)
tego
To him/her (there)
enko
To these
tenko
To those
askitenko
To everyone
kollego
To which
ellego
To this
tellego
To that
konkoyo
Whose (person)
moreyo
Mine
toreyo
Yours
avreyo
Ours
tureyo
Yours (Plural)
egeyo
His (to this)
tegeyo
His (to that)
enkayo
Theirs (this)
tenkayo
Theirs (that)
askitenkayo
Everybody's
kollegayo
Whose
ellegeyo
this one's
tellegayo
that one's
kongahAl
By Whom
morehAl
By Me
torehAl
By you
avrehAl
By Us
turehAl
By you (pl)
egahAl
By Him (this)
tegahAl
By Him (that)
enkohAl
By Them (these)
tenkohAl
By Them (those)
askitenkohAl
By Everyone
kollegohAl
By Which
ellegohAl
By This
tellegohAl
By That
kAyo
What
kAy
What
kago
Why
kOne
Which
iso
Like this
tiso
Like that
kiso
How
tiso
Like that
kiso
How
itko
This much
titko
That much
kitko
How much
elleT / ET
Here
telleT
There
kolleT /kOT
Where
ET
Here
kOT
where
tET
There
enguT
This side
tenguT
That side
konguT
Which side
emAm
In this
temAm
In that
komAm
In Which
kAiti
Something
konkodi
To Someone
kokkodi
for some reason
lento
Due to
lenku
until then
tokan
From
vedUr
Across To
atta
Now
phalca
Later
kAl
Yesterday
hindo
Today
sondo
Tomorrow
koTTi
Nowhere
kOTTi
Somewhere
meyikAyi
What Else
hi yeti
But
tii nhinAtto
Otherwise
nhiijet
If Not
hoyeti
But


Verbs - SourashtraDictionary.com


aTki
Arrange
aTki
Partly Close
andi
Reach
allaaT
Hurry
avngi
Press
anTcci
Control
aav
come
aan
Bring
aas
Laugh
ukki
Pluck
uDgi
Paralyze
uTci
Pull
uski
Bark
usil
Bounce
enDgi
Submit
ongaaT
Overturn
ongi
Stoop
oTci
Filter
oNTki
Shiver
otti
Aside
oppillE
Accept
orgi
Lean
orpi
Scrape
OT
Lose out
khalle
Get
khallE
Take
khavji
Scratch
katti
Shout
kabaaT
Save
kabillE
Hug
krupo keri
Please
kaLaLLe
Know
kavli
Mix
khaa
Eat
khaaT
Buy
khaaL
Play
gaaT
Bury
gaav
Sing
ghaaT
Churn
ghaal
Put
kaaT
Cut
kaaN
Hulling
guddi
Punch
guvni
Roll
gusil
Churn
ghunji
Wash Clothes
kuski
Pierce
kusir
Knead
khoot
Nip
kerlEt
Doing
gEs
Rub
kEr
Do
govnDaaT
Mislay
goLo kEr
Roll it circularly
goLi kEr
Roll it like a ball
kovri
Dig
kOs
Gore
caaT
Lick
caal
Walk
caav
Bite
cuTTuphiir
Swirl
cuNTi
Pinch
cekki
Chop
cercci
Save
cendi
Draw water
covri
Rear cattle
cET
Advance
cEr
Join
colli
Disperse
covdi
Read
cOr
Steal
dhaDDE
Send
tappaaT
Boil
daaT
Cross
daavo kEr
Argue
dhaam
Run
taay
Drop
dhikki
Bump
tircci
Bargain
tivunjci
Stuff
duLki
Spitting up (baby)
dhungi
Jump
dhuNTi
Swim
tukki
Lift
thuuv
spit
dhuul
Roll
dhuuv
Wash
theLci
Sprinkle
dekkaaT
Show
dekki
See
devsi
Attach
teTTi
Knock
termi
Repel
tevDi
Caress
tokki
Trample
dE
Give
dhEr
Touch
dhEr
Hold
tEs
Squash
dobbi
Push
dovDi
Drive
tongisa
Peek
tovunjci
Escape
thOv
Put down
tOT
Pluck
naas
Dance
naas
Erase
nigil
Start
ninji
Lay down
nivri
Manage
nivaaT
Cool
neski
Crush
nommi
Believe
phangiT
Winnow
bhandi
Tie
phaT
Tear
paaynjpOT
Pray
phille
Wear
phivri
Turn
bivunjci
Twist
bijji
Wet
pivli
Squeeze
piski
Strangle
phiir
Turn around
biis
Sit
bhunji
Roast
puTTo taai
Bore
phuuv
Blow
buuT
Dip
puus
Ask
pE
Drink
boski
Scratch
bhovri
Light it up
bhovri
Fill
pondi
Endure
poLgi
Socialize
poLTi
Fry
poLLipOT
Welter
poski
Scorch
phOT
Break
bOv
Call
pOm
Thread
pOs
Wipe
manji
Brush
marcci
Change
mallE
Fight
mhovli
Extinguish
maaT
Do
maaT
Celebrate
maay
Ask
mingi
Swallow
miTTi
Tap
miski
Blink
miiL
Meet
mujjo
Done
musaaT
Finish
mEn
Tell
moraaT
Kill
movji
Count
monTci
Fold
mOT
Break
mOr
Die
mOl
Screw
mOs
Wash
yOjano kEr
Think
rhakki
Wait
rhaa
Be
reguT
Rubbing Hard
buskitty rOT
Sob
rOT
Cry
laat
Kick
laav
Paint
likkaaT
Hide
likki
Write
lucci
Overthrow
lubbi
Grind
lejjaa
Take away
lombi
Hang on
lolpi
Mix Excessively
loski
Grind in mouth
vattokEr
Speak
vattokEr
Talk
vavri
Fan
vavri
Use
vaaT
Grind
vaar
Sweep
vikki
Sell
villi
Bend backwardly
vilunji
Shake-out
viin
Weave
viis
Throw
vekki
Search
vEl
Filter
jhaay
Close
jaay
Awake
jaan
Know
jhirkki
Creep
jiiv
Live
jhuur
Suck
jelaaT
Ignite
jevunji
Conquer
jOv
Compare
sangi
Say
savri
Smear
savo
Watch
saa
Look
saatte
Seeing
saar
Spend
sikki
Learn
sijjaaT
Boil it
siiv
Sew
sukkuLinji
Enjoy
suvji
Steam
segunji
Tolerate
seraaT
Consume
sovDi
Remove
sovNDaaT
Hang
sOT
Leave
sOl
Peel
shikkaaT
Train
handi
Cook
havli
Shake
haLci
Rinse
haan
Beat
hingi
Climb
hibbi rhaa
Stand
hibbirhavaaT
Stop
hungi
Smell
huttir
Alight
hulpi
Shake
huuT
Get up
huuT
Fly
huuT
Open
huul
Scrub
hET
Take
hovDi
Grow
tegalenGu
Till Then
meni
So
telle hAl
Hence
thE vELUs
Right Then
kerevEnGu
As Soon As
khobbim
Always
khobbo
When
khobbo thebbO
Often
okOkku
One By One
sOn
Likewise
tegalenta
Until Then
virtAk
Waste


Nouns - SourashtraDictionary.com
aggaboggayi
Anxious
akaas
Sky
angiDi
Shop
angu
Yet
aDgyaLam
Identification mark
aDDam
Across
aDAt
Atrocity
aNTTu
Uncleanness
antu
Final
antu
Last
antum
Lastly
andus
Beauty
abbai
Available
apsaras
Celestial Nymph
abiprAyam
Opinion
abhivAdano
Welcome
ambuDAtte
Sensitive Tooth
amrut
Elixir
ayki
Listen
arttu
Meaning
arthunhaatta
Meaningless
alaggo
Alone
alpuDu
Mean minded
avsar
Hurry
annyAv
Unjust
anusAr
According
asko
Altogether
aso
Like that
asokeri
Just like that
aaLi
Groove
aasto
Desire
aasu
Vowel
irOT
Untimely
ivar
Details
ivar
Message
iso
Like this
iSTam
Will
uTchAvuTchini
Uncertain
uNTo
Curl
uNDo
Orb
uttES
Purpose
utjam
Tension
utsAho
Jolly
upadES
Advise
upahaar
Help
uratte
Ooze
urAv
Remnant
unnovubir
More or less
uje dinnu
Birthday
usur jAtte
Nasal drip
UTo
Spring
UbonDi
Train
USTu
Burning Stomach
tyAr
Ready
ogat
Fasting
OLDu
Aged
ogari
Nausea
onGini
Tilt
oNTE oNTe
Only
oNTEsko
Together
sukki
Become Dry
oppAi
Like
oydusAlo
Hospital
orsu
Age
oro
Skewness, Cover
oro
Well Ring
orotiro
ZigZag
oLotiLo
Excessive
ostu
Relation
OTu
Secret
Orto
On the corner
Orppu
Compromise
Orto
Sideways
Osaeme
Many a time
auLi
Termite Mound
kharuDa
Soap
khali
Empty
garan
Glory
ghantro
Bundle
ghano
Expeller
katko
Sickle
kabus
Cotton
karam
Red Sand
kaLAi
Know
kasu
Fountain
kSamo
Apology
kSaruDo
Soap
kSEmu
Comfort
gAT
Knot
gAm
Town
gAL
Scold
ghAm
Blow
kAT
Stain
kAm
Work
kALDu
Quarter Rupee
kAsu
rupee
gido
Scratch
ghinighAT
Small Bell
kinGkaro
Slave
kinGkir
Nausea
kin
And
gIt
Song
ghIr
Depth
khudA
Hypothecate
khubAi
Glare
guNDaLi
Coil
guNNu
Character
gutti
Bottle
gude
Stick
guruttu
Identification
guLLo
Ball
guSTi
Cart
kutUhalo
Interest
kuppo
Waste
kurchi
For
ghUT
Nest
guNuk ghalli
Hugging Knees
kUt
Shout or Bawl
khedo
Story
kheni
Story
genJAev
Hashish
geDDO
Tumor
geDi
Cart
geruv
Arrogance
geLai
Seep
geNAt
Treasure
gesi
Pickle
gheDi
Sound
gheDi
Solid
gheDiketto
Smart
ghenam
Pride
keTTe
Wood
keNDokeLo
Chubby
kettirikke
Scissors
kerungai
Dissolve
kerum
Karma
keLci
Mock
keLLu
Toddy
khEl
Game
gE
Last
gEgu
Around
gAEvAL
Last time
kEr
Care
kobaT
cleverness
khobbadi
Rarely
khobbim
Always
khoLTi
Carry Bag
goNDyaav
Henna
ghoDApolko
Small Bench
ghonaghoNAi
Baby crawling
ghoram
Focus
ghovlo
A Gable in the wall
konjcudo
Shy
koppal
Ship
kommo
Branch
kovDO
Cowrie Shell
kono
Edge
gOs
Free
kaut
Fun
kaulo
Sewage
caki
Machine
calai
Happen
calni
In Touch
chALi
Life
cATo
Whip
cArpAynG
Chair
cAri
Spy
cAl
Puberty
chiran
Lantern
cinto
Worry
cinto
Idea
cunkili
Escaping
cuTTO
Cigar
cuTTO
Cheroot
cunDAi
Hot
cuNDin tagatte
Burn with hot iron
cunno
Lime
cuuk
Complain
chekku
Wheel
ceDni
Advancement
ceDaav
Advanced
cenDu
Ball
cendurhaDo
Mini Ferris wheel
celvO
Laundry
cevDi
Dissuade
choro
Prey
cEku
Dirt
chailo
Shadow
jnAen
Knowledge
DEro
Tent
damaru
Lotus
dhakkile
Timid
dhamAdhAm
Hurry Burry
dhannu
Thanks
uLE
Whistle
dhanu
Bow
tadi
System
tare
Fee
thAm
Place
dAN
Staff, Handle
dAvo
Argument
dhAku
Fear
dhADo
Wide open
dhAn
Donation
tAru
Ship
dikkul
Inattention
divaLi
Diwali
dincari
Note book
dijaariyo
Wear and Tear
timur
Arrogance
tiruvAli
Mischievous
tivi
Long Bench
tiguccar
By itself
tinnAL
Festival
digAL
Famine
durbaL
Poor
dukkhu poDatte
Sorry
tuDan
Change
dhuumpaan vaLTi
Cigarette
dUr
Far
dhUm
Smoke
dhUm phuvatte
Smoking
tUr
Enter
theTki
stumble
theTkini
Stuck
deTTu
Dense
deNDu
Useless
deLDri
Sluggard
dheyriyam
Courage
dheramburAl
Edgy
dherni
Be caught
dherum
Donation
tegahollAdu
Next then
tersu
Continuously
telpi
Tease
thEvu
Workshop
dori
Thread
doskokhAl
Upside down
tokkul
Contempt
tokan
From
dobbAdobbini
Hustle bustle
torap
Clue
toran
Line
dOr
Rope
tOs
Top
dauNo
Mirro
nanku
Trust
nandinun
Wishes
nandinun
Congrats
narAji
Balance
nasinam
Ruin
nhAnA
Not
nAvu
Name
nAsti
Destruction
nikku
Mark
nimmaL
Peace
niyam
Rule
nyAv
Just
nivri
Sharing
niLcci
Steady
nijjam
Fact
nisto
Only
nIbu
Wooden water bucket
nIvi
Wooden bucket
nuru
Foam
nEku
Clean
nErvedur
Quite the opposite
poLgini
Socializing
nomkke
Confidence
nOgu
Action
nauko
Boat
badulO
Long Bench
bandhu
Relative
baro
Heal
baro
Good
bajaar
Market
bhari
Big
bharo
Load
bhastu
Bellows
padAL
Underworld
paraNDo
Dried Coconut Leaf
parti
Instead
prApti
Luck
prAmo
Love
parigho
Trench
pariNaam
Evolution
prEraNo
Inspiration
prEv hoye
Darling
panmaNke
Hesitation
pajehOtte
Need
paso
Splinter
phAT
Crack
bAN
Arrow
bAdo
Grief
bhavAT
Uproar
bhAru
Weight
pAntu
Traveler
phiri
Again
bigus
Pressure
bhiNDi
Trusting
bhinti
Chisel
bhigAr
Business
bhigArsAr
Business
birus
Tight
pirjanam
Benefit
piLTi
Doll
pisattanam
Nonsense
phuro
Enough
phurohOtte
Bored
phulAphuli
White Wart
phuvaNi
Bugle
phuvaNi
Whistle
buddhi
Wisdom
busko
Waste yarn
puTTo
Hole
pusni
Question
pUrA
Fully
bedur
Stunned
bheLLi
More
bheLi
Very
peTmaaT
Sitting Cross legged
peDi
Box
peyno
Travel
perumbO
Drat
penghanO
Expeller
pesyAev
Broad
pEN
Expeller Cake
phailAdi
Etcetera
bai
Debit
paiDi
Cap
boNDi
Vehicle
boNaal
Fire Cracker
bolam
Strength
bhonghuro
Top
bhoyGs
Opulence, Status
bhoraNi
Casket
pokku
Hull
ponji
Village Council
poTTAs
Fire Cracker
potjAeL
Jealous
poTjaLi
Jealousy
polko
Wooden Board
phOru
Table
phoL
Benefit
phOsu
Foam
paurat
Rebuke
manjan bhurkO
Tooth Powder
mhaggo
Costly
mhaddi
Centre
mhajAr
Center
mhaujAi
Will be extinct
mhaujAnA
Will be extant
mAl
Pulley Belt
mAlo
Garland
mitru
Friend
mitruppan
Friendship
mindin mellattE
Saying "Thanks"
niLatte
Departure
miLNi
Meeting
mudullo
Firstly
muri
Dirt
musai
Possible
mettan
Soft
meLLo
Also, Too
meLLi
Also
meni
So
mosi
Soot
mET
Best
mETun
Elite
mEjo
Table
mokkuLo
Delightfully
moduraLi
Employer
morgyAet
Respect
moraNu patro
Will
moraLi
Rich
moran
Death
moLTi
Bundle
moLTo
Bundle
moNNi
Bead
monnudhere
Mental
mosAeN
Cemetry
mOl
Price
mOs
Humbug
yOjano
Plan
raNi
Queen
rUp
Figure, Image
rajo
King
rhatto
Real
rhiye onnu
All of a Sudden
rheDo
Sewing Machine
raak
anger
rIN
Debt
rundi
Spread
rumpi
Elixir
rUDhi
Habit
rUTu
Robbery
rUNi
Habit
rUpavati
Pretty
recce
Noise
rendu
Gap
resto
Road
rEm
Department
rokDo
Cash
rosam
Irate
rOk
Disease
lamburum
Always
lhekkani
Computer
lhekkO
Account
lAnGu
Bridge
lAp
Profit, Benefit
lindu
Account
lunkDo
Scissors
lekku
Particular Place
lEkhu
Letter
loTkini
Stumble
loDattE
To come inside
lombi
Tired
lavgAs
Matter
vaTke
Custom
vaDai
Wilt
vaDO
Share
vattAphuTki
Dictionary
vattApeDi
Dictionary
vatto
Speech
vatto
Conversation
vatto
Word
vAT
Way
vADi
Fence
vAp
Vapour
vAL
Number of times
vikku
Posion
vicAr
Sad
virtA
Unnecessary
virtAvatto
Gossip
vipaNi
Market
vijano
Fan
visvAs
Faith
visinJi
Blossom
visvASTo
Irritation
visvAs
Belief
vekkinidekkini
Interview
vekuLa
Different
veDi
Fun
vedur
In front of
vevlo
Flood
veLu
Funeral
vEi
Let it be
vELAvELuk
Timely
vEs
Expense
jhari
Flood
jhari
Waterfall
jAgaramka
Awake
janDAvu
Flag
jamAn
Luggage
jaTkyempAn
Horoscope
javAp
Answer
jhAr
Flood
jaal
Net
jaaL
Burn
jitrav
Life
jiyes
Gone
jivtajIv
Alive
jInu
Garden
jIg
Victory
jiiliavus
Goodbye
jhukku
More
jhugu
Many
julan
Shining
jheDo
Fight
jherpAy
Seep
olo
Net
jellu
Drool
moDo
Corpse
jelum
Life
jEm
Gift
sampattu
Prosperity
samruddhi
Prosperous
samAcAr
News
sarAv
Balance
savaNi
Video
svatantro
Independence
swayasukham
Selfishness
sadhAraNa
Simple
singati
Girl Friend
singait
Boy Friend
singAer
Beauty
singAer hoye
Handsome
silmo
Labor
siim
Border
surat
Irate
sUcano
Information
sUt
Burn with hot iron
segunJuno
Endure
sengaL
Chain
sengu
Company
sengO
Along
seddu
Noise, Sound
settu
Promise
sendEv
Doubt
serkkas
Ok
serkki
Cotton
serccatte
Solving
sermaaT
Along
cermAn
Equivalent
serAti
With
sero
Arrack
sevkan
Best person
sENam
Soon
songo
Cheap
sEtu
Bridge
sEvo
Service
sovNtini
Be captured
sontu
Happy
sondOS
Happiness
sontOSkan
Happily
sombu
Happiness
sombuLO
Salary
sOn
Like that
sauryam
Well
saurAStrA
Sourashtra
shambu
Science
shibiro
Camp
siin
Tiredness
SObhano
Nice
hanGkAr
Rage
haddaDDU
1/2 of a Rupee
haddAmuddu
Half-done
hadAL
Boom
habAL
Sky
harmbam
Beginning
hannav
Money
haaku
Garden
haatvadini
Cell Phone
hAi
Yeah
hAi
Yup
hinGADu
Export
hiNDini
Wandering
hiddi
Little bit
hitau
Benefit
hindaLo
Swing
hinal
Hell
hIn
Evil
huDo
Belly down
huDothiDo
Upside down
nitrADu
Import
hubbas
Out of breath
hubbAvi
Innocent / Naive
hurpaDo
Flip / Reverse Side
heDDae
Stupid
hemmal
Haughtiness
hogat
Medicine
hoDi
Lap
hoyat
If
hollovAL
Next time
hollAdu
Next
hOnDO
So be it


asmadAdi vargu - catur bhaSa vallari -Prof T.M. R
mii
I
tU
you
teno
that boy
ami
we
tumi
you
tenu
they
moro
mine
toro
yours
avro
ours
turo
yours
kOn
who
eno
this boy
inO
this girl
dinO
that girl
kOn
who
elyO
this
asko
whole
kOnyO
which
telyO
that
apul
himself


manuSAdi vargu - catur bhaSa vallari - Prof Ramara


meniku
man
Ontu
younggirl
ostu
relatives
javNo
youngman
javNi
younggirl
sinGAdin
male-friend
Singadi
female-friend
bApu
father
mAyi
mother
bhai
brother
bheynu
sister
mhoTTabO
paternal grandfather
ajjaebO
maternal grandfather
mhoTTambO
paternal grandmother
ayambO
maternal grandmother
mamo
uncle
mami
aunt
bhojai
youngerbrother’s wife
natte
grandson
nadini
granddaughter
devaru
husband’s younger brother
saLO
wife’s brother
saLi
wife’s sister
nenandu
husband’s sister
sosuro
husband/wife’s father
sasu
husband/wife's mother
jomai
son in law
bhowNDi
daughter in law
eDo
deaf
andhu
blind
panGku
lame
mukuLo
dumb
kekuDo
cross eyed
giDDo
dwarf
nhavan
wash from head
varttu
wedding ceremony
savmo
nArmaDi
kovso
silk
chowuLi
blouse
chiwno
cover
rAnkavu
shawl
kambLo
blanket
bhUSo
jewelry


guruvAdi vargu
guru
teacher
vidyAvi
scholar
bhavNO
brahmin
prOhito
preacher
jOsi
astrologist
voydu
physician
vaNi
merchant
vare
business
niivi
first income
keLTar
interest
mOlu
price
nAvi
boatsman
gavru
herdsman
khumbAru
potter
hoDai
carpenter
khati
blacksmith
lavri
builder
sumpi
tailor
dhurkhe
cobbler
lubdu
hunter
bheDe
laborer on wage


sariirAdi vargu


sariiru
body
AnGu
parts of the body
dosko
head
tONu
mouth
kapALu
forehead
doLo
eye
papini
eyebrow
misini
eyelid
bapili
pupil
nAku
nose
kAnu
ear
gapulO
cheek
gAlu
chin
ciipu
chin
hOTu
lip
khEsu
hair
sigo(kuDumi)
hair tied in a bun
bhAnGgu
parting of hair
veni
plaid
alko
curly hair
mUsu
moustache
khopo
elbo
juTTi(kuDumi)
bunned hair
jiipu
tongue
dAtu
tooth
sogi
molars
geLo
neck
kAku
underarm
hEmu
chest
pODu
stomach
pADu
back
bhombi
naval
tiri
lower back
kEDu
hip
angu
lap
Uru
thigh
guDgo
knee
jAnGgu
ankle
ponGgu
foot
paLTi
heel
gATu
balls of feet
pagul
bottom of feet
khAndu
shoulder
boNTe
?
khovo
elbow
kOSTu
forearm
kankro
wrist
hAtu
hand
angiLi
finger
hanguTo
thumb
darjini
index finger
maddhi angiLi
middle finger
muddi angiLi
ring finger
kiLAngiLi
pinky
nekku
nail
mUTu
fist
chULu
handfull measure
anJili
putting hands together pray
bOTu
inch
viiDu
hand size
hAtu
one foot
vAmbu
chest
haDko
bone
antro
intestine
mAmsu
meat
kanGkLo
Skull
rekatu
blood
piipu
puzz
uSTo
saliva
siNi
drool
gU
stool
mUtu
urine
dUvu
mucus of the eye
simbuTu
mucus
pinJu
Ear Vax
tovuDo
skin
sinnu
nerve
ujvAvu
birth
moran
death
suju
swelling
phupni
blister
arso
anus
vamni
retching
khowlo
caugh
khAju
valor
khajjU
eczema
pholi
acne
kapho
phlegm
nuti
fame
ninto
scold
lAju
shy
SAnti
peace
iirSo
jealousy
asUyo
vengeful
sontu
happy
prEmo
love
iSNi
desire
savSNi
courage
dherni
adamant
sikini
sneeze
jombLai
yawn
niinJu
sleep
sopno
dream
hOnGu
sleep
hAsu
laugh
rODu
cry
monnu
mind
haTvan
memory
cinto
thought
sandEvu
doubt
bhrAnti
confusion


bubhukSAdi vargu




bhUku
hunger
sOku
thurst
rucci
taste
jeman
feast
dUtu
milk
guLLu
jaggery
Sakkaru
sugar
gheNDu(misri)
sweet candy
dhenGi
yogurt
tAku
butter milk
lasni
puffed rice
cipTo
flattened rice
suro
beer
kheruDu
pungent
ambaTu
sour
tikke
hot
kasni(ogur)
a form of taste
koDu
bitter
guLLe
sweet
gruhAdi vargu


ghEru
house
savdo
upstairs
rawLu
palace
kase
part of the house
kAre
prison
kaNo
industry
gOSTu
barn
kavmo
entrance
viDge
brick
bhiitu
wall
dAru
entrance
aino
courtyard
humbro
step
vAli
store room
poLTo
roof
kavADu
door
soWno (vaNkaNi)
staircase
sENi
ladder
bhonno
pot
ghaDo(koDum)
Pot
gagiDi
Pot
sarAvu
lid
harvii
plate
tambe
small pot
bhundaro
cooking vessel
subDo
muram
cAlni
sieve
hosni
vessel
cullo
stove
seni
dried cow dung
vinGaL
hot coal
alto
wood burning
khoLche
coal
Katrii
scissors
viLi
cutting knife
paTo
grinding stone
lublO
stone that twirls
hogaL
grinding stone
musaL
wooden pounder
dawNo
mirror
vijano
hand fan
divo
lamp
siko
hanging pot
mottu
wooden tool for churning.
kodu
an utensil
peTi
box
kunJi
key
monGce
cot
hinduLo
swing
saudi
bed
boryO
mat
hubro
pillow
khauDi
big pillow
kundrO
porcelain pot
pavgaL
wooden slipper
sAlu
sharpener rock
rauNi
lifter
poro
gamble


pADasAlAdi vargu


indu
school
vaddi
teacher
mANavu
student
vargu
class
poti
book(bundles palm leaf)
polko
low stool
koTni
pencil of old times(sharp pen)
kaLjem
paper
lEku
feather
churi
knife
sai
ink
sainiDi
inkbottle
vaLi
line
likkhitu
script
juDi
language
cAlu
behavior
arthu
meaning
paTini
study
manano
mind
pusini
question
javni
farewell
vatto
word
montu
mistake
nirastu
speed talk
vettu
stick
piiTho
seat
saettu
truth


vAnAdi vargu


vano
garden
jhADu
tree
gulmo
bush
bii
seed
ankro
sprout
mUlu
root
sAgO
branch
vElu
vine
olo
blossom
sibo
branch of a banyan tree(aerial roots)
pAnu
leaf
dEDu
small branch
keLin
bud
phUlu
flower
vallari
bouquet of flowers
mai
honey
gucho
bunch
pindo
small green
kailo
unripe
poLLo
ripe
aLo
walkway/small wall around the farming area
vaLko
cucumber
poDDulo
snake gourd
kallo
bitter gourd
vangi
egg plant/brinjal
muLo
radish
Alu
sweet potato
deguLo
green(spinach)
tiiLu
sesame seed
jiro
cumin seed
mhuri
mustard seed
dhane
coriander seed
mitti
fenugreek seed
omo
ajwain
allo
ginger
ODA
seed of banyan tree
jaDii
icci(tropical seed)
biilu
vilvam
palAsu
murukkam
madU
iluppai
ciisu
tamarind
tUdu
pUvarasu
somi
vanni
pUrNi
ilavam
vENu
bamboo
nareLu
coconut
tALu
palm
sevko
drum stick
nallU
vetti vEr
bOru
berry
umbLo
atti
kovDu
viLA
jambu
nAval(berry)
phonniisu
jack fruit
daLim
pomegranate
ambLo
gooseberry
dakku
grape
kELu
plantain
kEdu
tALai(kevra)
sompe
saNbagam
hiri
kuruvEr
damaru
lotus
sALu
paddy
nibbari
rice grass
tandu
rice
chenno
peas
kuLitu
lentil
ghOmu
wheat
losan
garlic
haLatu
hingu
miiTu
salt
miri
pepper
tikno
red pepper
soNTi
dried ginger
pimpaL
peepal(tippili)
hekaNu
vasambu
madhuram
adimaduram
rAsnu
rasnaa
eLo
cardamom
lomphUl
cloves
gumAru
katraaLai(cactus)
magApAnu
karappaan leaf
govatu
dry grass
kalambu
kadambu
vaLko
cinnamon
sommi
bran(husk)
koNDo
fine bran
kaTkal
husk(padar)
nArinGi
kiccili fruit
keLo
banana
uDit
piegeon peas
malligephUl
jasmine
liimphUl
neem flower
kEdphUl
tALam(kevra) flower
kELuphUl
plantain flower
kELujhAT
plantain plant
kasLAjhAT
Eecham plant
kovDujhAT
kovdu tree
ODAjhAT
banyan treel
liim jhAT
neem tree
umbLAjhAT
atti tree
nareLjhAT
coconut tree
tALujhAT
palm tree
ponnisujhAT
jackfruit tree
lOhAdi vargu


lOvu
metal
sonno
gold
ruppo
silver
tambe
copper
liidi
brass
lhogaNu
iron
kaso
venkalam
hiraN
gold
tau
metal sheet
pombLo
ruby
lhOGgu
red stone
moti
pearl
rattan
ratnam
kestul
mercury




nArAcikAdi vargu


narAji
balance(scale)
jAlu
net
bhastu
bellow
bhinti
screw driver
TanKu
chisel
dantni
plyer
bhosni
file
lUvu
saw
parsu
spade
Aro
cobbler’s needle
khantuDo
crow bar
halo
plough
iiso
tip of plough






mrugAdi vargu


mrugo
animal
simho
lion
vAghu
tiger
haistu
elephant
bhallu
bear
vrugo
wolf
ghoDo
horse
goru
ox
gAyi
cow
muyi
camel
potulo
buffalo
bheysu
bison
ghedaDu
donkey
dukkaru
pig
kholo
fox
soso
rabbit
harin
deer
manJiri
cat
nakulu
crocodile
ciglo
squirrel
saraLu
chameleon
suno
dog
hundiiru
mouse
cunchu
mouse?
soNTi
trunk
sinGDO
horn
khuro
cloves
pUsu
tail
Asaru
calf
gongu(mandai)
clan of cow
UDo
tits
sApu
snake
viGjcu
scorpion
salAkdukkar
hedgehog




pakSiyAdi vargu


pakSi
bird
rekka
wing
pakSipillo
chick
chonchu
beak
aNDo
egg
niiDo
nest
kawLo
crow
ghAru
vulture
ciDi
sparrow
kukDo
cock
mhaki
house fly
ghUko
owl
mhOru
peacock
kokilu
koel
bago
crane
bharkaLi
frog
mhaLi
fish
kirvil
crab
kaspo
tortoise
nakru
crocodile
jULu
leech


mrittikAdi vargu


matti
soil
vaLu
sand
dhULi
dust
khEtu
dried leaves
bhuyG
earth
dEsi
country
nagari
town
gAmu
city
olli
village
siim
boundary
vAlmii
ant-hill
pontu
store
vipaNi
shopping area
viidhi
street
haTo
market
nANo
coin
rupAyi
currency
rANu
forest
vADi
fence
kunJe
hut
adri
mound
teDo
slope
postu
top/peak
marin
Mirage
durgAdi vargu


durugu
fort
khEyi
trench
rAjji
anarchy
rajo
king
rANi
queen
amAtyo
minister
karo
tax?/paymeny
kOsu
treasure
sati
umbrella
samari
sAmaram
paLo
army
patti
knave
nuddi
warrior
nuddu
war
sEni
sergeant
kiriiDi
crown
aidu
weapon
dhanu
bow
bANo
arrow
tUNi
holder for arrows
rettu
chariot
goNDi
vehicle
cakkuru
wheel
nEmi
tie
cAt
stick
ANi
accANi(pin)
damo
tari(rope)
sATo
whip
nadri
saddle
pole
dam
khalin
rein
kUbaro
tip of the plough
nugo
the frame on the neck of a horse or abull
sulko
duty/tax


samudrAdi vargu


sonduru
sea
lAT
wave
avri
whirlpool
tiiru
bank
diivu
island
cakkil
reach
pulni
float
nAv
boat
dONi
canoe
tare
mast
kUpo
sail
khEviNi
backside?
aLni
post
hovli
spring
ninno
depth
utto
height
neddi
river
jhari
cascade
kasu
spring
pani
water
srOvu
flood
soro
pool/pond
taLo
lake
haDo
vale
kavlo
channel
sEtu
bridge


AkAsAdi vargu


akAsu
sky
surit
Sun
candAmu
moon
nakSatru
star
pariLi
periphery
kiraNo
ray
kAnti
glow
ghirO
planet
ghiraNo
eclipse
hapAL
cloud
garjano
thunder
cabal
lightning
iran
thunderbolt
pavi
thunderbolt
himo
chill
hinno
ice
povsu
rain
siigal
drizzle
karko
hail
diso
direction
kAlu
time
gheDi
frame of time
mhUrtu
auspicious time
paDvo
primary
dinnu
day
rAti
night
vAru
week
pakSo
14days period
amAsu
new moon
Punnimu
full moon
mhaDo
month
rutu
season
orsu
year


adhikAdi vargu


addiku
more
oLoku
less
mettan
soft
kaThin
hard
sukke
dry
ollo
wet
uDDo
circular
maLii
dirty
kUso
lean
hunno
warm
siLLo
cool
vekuLo
different
niccu
continuous
sanne
general/common
suTam
regular/even
mittam
irregular
duTko
split
gaDsu
uneven/rough
kugno
clustered/intact
rujum
in person/evident


purAdi vargu


phuLLo
forward/first
sAmmu
across
sommallo
in front of
prAg
before
atta
now
thebba
then
khobba
when
khobbiku
always
OvELum
never
khobbatim
rarely
Phalca
later
kAli
yesterday
sondaro
tomorrow
hinda
today
poram
day after
phaltaphArim
morning
viiLTo
evening
attenGuT
later
ET
here
tET
there
kOT
where
koTTim
nowhere
kODti
anywhere
bhittarim
inside
kOnlenGu
upto where
tyElenGu
upto there
isno
small
OkOkun
each one
kiso
how
kAyi
what
mekkAyi
then what
menin
so said
tevannu
suddenly
eti
so
sii
did
kii
did?
U/hO
addressing
kin
hAn is it so?
hAhA
yes
dhii
yuk
kini/kin
and
etmeLLi
even if
tennavEnGu
right away
tii
that
dheri
because of
jata/urEka
on top of it
vinEka
not only that
ahO
is it?
Ute
waste
hOnAjiyEt
if not done
nhiinAjiyEt
if not there
athavA
still
nhAjiyet
otherwise
soko
like that
gO
just without any reason
phuro
enough
nhii
not
bheLLi
superlative degree
hAYi
yes(definitely)
nhA
no
iso
so
thebbAsi
right thren
pharAddum
later
thebbayet
then/if so
kokolenta
why so
tekalenta
that is why
koko
why




sankhyAdi vargu


Sankhyo
number
onGku
digit
O- yOk
one
dii
two
thiin
three
cAru
four
pAnJcu
five
sO
six
sAtu
seven
ATu
eight
novu
nine
dessu
ten
vigyAru
eleven
bAru
twelve
tEru
thirteen
covudu
fourteen
phandaru
fifteen
sovaL
sisteen
sattaru
seventeen
orADu
eighteen
oNiisu
ninteen
viisu
twenty
yOgaLiisu
twenty one
tiisu
thirty
caLisu
forty
ponnAsu
fifty
sATu
sixty
siiru
seventy
asi
eighty
nautu
ninety
sOvu
hundred
sasaru
thousand
lekku
lakh
kOTi
million
bhinno
fraction
tivo
three quarters
haddu
half
covuto
Quarter


kriyA vargu


jigasu
wins
ovasu
bears
uchlasu
yields
tarasu
crosses
tirasu
swims
gilasu
swallows
kunGasu
shrinks
nuvasu
praises
luNTasu
rolls
siTasu
visits
dhunvasu
shake off
linkasu
stay aside
nudasu
pushes
silincjasu
spray
tuvasu
relieved
vinGkasu
different
tanGkasu
shrinks
sommasu
pardons
uNasu
dives
tomasu
desires
phigasu
throws
mudasu
amused
kuSasu
ploughs
bhunJasu
fries
Sausasu
rules
Somasu
tolerant
onjasu
cheats
vawrasu
fans
pusasu
asks
vasasu
lives
likkasu
writes
gavasu
sings
phulasu
blossoms
dherasu
catches
ganasu
digs
ivulasu
reads
durlasu
looses
kamplasu
shakyfits
pontulasu
competes
pullasu
floats
silgulasu
praises
yatulasu
tries
mugulasu
searches
sinkulasu
doubts
dhamlasu
runs
huLLasu
flies
tivulasu
saves
ovusu
bearing
jivusu
living
jigusu
winning
rAjjalarEs
ruling
jigesi
you won
aikesi
youheard
jiyesi
you went
sAyi
will see
jAyi
will go
cavai
will bite
rhA
stay
hibbi
stand
hUTi
get up
biisi
sit
jAni
learn
bhandi
build
khADi
buy
hugiiDi
open
jhAgi
close
ninGki
beat(wash)
hova
become
manJi
wash
nUvi
fame
dE
give
jAgi
awake
ninJi
sleep
bUDi
dip
rakSAvi
rescue
jA
go
Avi
come
vattakEri
talk
kEri
act
dhaDDe
send
rUNi
interrupt
dhEri
catch
iiivi
study
sAkkako
to see
pEttako
to drink
buDattako
to immerse
jAttako
to go
rhAttako
to stay
jigattako
to win
kerattako
to do
jemattako
to eat
janattako
to know
dEttako
to give
likin
by writing
hoti
by being
sevi
met
jeyi
went and
jemi
ate and
keri
did and
Jii
went and
nami
obeissance
dii
gave and
hani
killed and
giDi
shortened and
maDi
started and
thovi
laid and
aikin
heard and
Adari
supportively
visurai
forgot and
bisi
sit and
nami
obeyed and
anugrahi
blessed and
soDi
left and
khaLLi
took and
huTi
got up and
bovi
called and
avi
came and
kerADi
have done
huTADi
have arouse
janaDi
let know and
huTaDi
aroused and


Prathama pADam


tU kOn
who are you?
tyEsE
yes it is.
tyE sEkii
is it there?
mii ElasE
I am here.
bhittar jA
go inside.
bharAT Avi
come outside.
sEhAn
is it there?
ETrhA
be here.
mogo dE
give to me.
kOn samartu
who is smart?
dEnoko
don’t give
pEnoko
don’t drink
kernoko
don’t do
tenOsSivo
he is Siva.
kAyameni
what is the matter.
nhiisi
not for sure
koko
why
dukkaLLunoko
don’t mourn.
jajjA
go away.
kitga dUru
how far?
tEDutenu
those over there
tisOsi
the way it is.
sontrodii
at least tomorrow
poromuti
at least day after.
gOrhA
be quiet.
mii kOn
who am I?
tET kOn
who is there?
mOlkitko
how much?
rhiyeti
if available




dvidiya pATham


Turo nAvu kAyi
what is your name?
kiiSNu meni menan
they call me KISHNU.
tumre vamsAvaLi sanGi
what is your ancestry?
ami askin meLLi viprun
we all are viprus.
aikatteko iSat rhiyesi
I wish to know.
gAyi covrasu
cow is grazing.
kernAtto rhAndagu
Let them not do it.
nhii meni menan hOnA
Don’t say no.
torhAli vruddhi hona sAette
Has to be enriched by you.
kiiSNuku sAnJArhiyesi
I am going to see KISHNU.
ture jOLum kAyi sE
What do you have?
haTvi haTvi harik namasu
I pay obeissance to Hari quite often.


Trudiiya pATham


Durjana senta koTTi jAn khOnA
Never should associate with bad people
choDDa sara koTTi rhAn hOnA
Never stay with a thief.
toko dekkaDe kAm hoyeshAn
Is the job that was given to you done?




Sourashtra Action Word to Passive Word


sA
savaDi
khA
khavaDi
dE
devADi
khADi
khaDADi
sAri
sarADi
likki
likkADi
iigi
igADi
khUDi
khuDADi
sanGi
sanGADi
hoDi
hoDADi
toDi
toDADi
moDi
moDADi
sODi
soDADi
chOri
chorADi
huDasu
huDvasu
guNasu
guNvasu
soDasu
soDvasu
moDasu
moDvasu
boLasi
boWlasu
Calasu
calvasu
miLasu
miLvasu
kheDasu
kheDvasu
buDasru
buDval
hoTasu
hoTvasu
dhunKi
dhunkAt
khaLitthe
khaLaDitte
khaLu
khaLaDu
jAEDiyo
javaTTiyo
phoDeyo
phuTTtiyo
chalai
chaladai
goundiyo
goundaTiyo
javu
javaDu
savAd
Savadriyo
nivAd
nivaderas
kEr
kerAt
aiki
aikAT
bisitE
bisaDittE
handi
handAt
pAE
pevADi


Temple Words SourashtraDictionary.com


dhavro
Temple
dEv
God
kiiSTu
Lord Krishna
iispuru
Lord Shiva
bhArati
Goddess Saraswathi
viNAi
Lord Ganesh
viNAi
Celebration of arrival of Lord Ganesh from Kailash Parvath
ghiNinghAT
Bell
dhuvatti
Multi wick oil lamp
somburANi
IncenSe
attimbur
Camphor
divO
Lamp
divATaLo
Prayer / Oil Lamp
vAt
Wick
divApeDi
Match Box
divAkhaTTi
Match Stick
paynjto
Hindu Prostration
bigit
Sacred Ash
kungum
Vermilion
naam
Trident Mark on the Forehead
nAmugeDDo
White Clay Chalk
nAmuphuTki
Trident Box
sende
Salutation to Time of Junction
dorbo
Holy Grass
pujo
Act of worship
phUl
Flower
rettu
chariot
karo
offering


House - SourashtraDictionary.com


agAsuTi
Roof Window
aLTO
Attic
geLai
Leaking
oLen
Rain water gutter
kavAT
Door
kAp
Tenancy
kApkeri
Tenant
khapuro
Roof Tiles
khiiL
Door Lock
khoTTO
Hall
gellO
Earthen pot for storing grains
gauDi
Mattress
gheDigaLo
Wall Clock
ghErkeri
House owner
ghEr
House
ghErkAp
House warming
chabo
Floor mat
jenkaLam
Bedsheet
jejju
Dust
telkaT
Pillow
tauram
Room
daar
Threshold
daarumiTTO
Doorstep
duruku
Fort
dhuLAdhULi
Cobweb
dhULi
Cobweb
nevDO
Corridor
badalgiDi
A long rope with a hook to lift the bucket fell in the well
pUT
Lock
poro
Bottom Drawer of a Bureau
poLTo
Roof
phaavu
narrow passage between the entrance and the living room
baDkE
Rent
biyaat
Key
bii
Key
bondo
Rat burrow
bhiit
Wall
maLo
Toilet
muguT
Guider
mukku
Street Corner
muggu
Vintage Line
rawuL
Palace
rheDo
Pulley of a Well
vijano
Hand Fan
viDi
Window
viDikavAT
Window pane
viDge
Brick
vidde
Upstairs
viit
Street
sENi
Ladder
savno
Stairs
settar
Tavern
sendu
Lane
soDumunjjo
Morning sweep of the fronyard
sauti
Bed
hubro
Pillow
hoDAr
Courtyard
hoLTO
Village style Veranda


Human Body - SourashtraDictionary.com


taLu
Crown of Scalp
dosko
Head
khEs
Hair
sigo
Ponytail / Mohawk
alko
Curly hair
khopo
Bun Hairstyle
hujALkhEs
Gray Hair
veni
Pleat Hair
jeDo
Braids
jhoDo
Matted hair
juTTi
Ponytail / Mohawk
taLupoTTal
Bald
guNDu
Tonsure
bhAnGgu
Hair parting
tON
Face
kabAL
Forehead
pavni
Eyebrow
misini/roppo
Eyelid
doLo
Eye
doLaa aNTo
Cornea of Eye
orodoLo
Squint Eye
kekuDo
Squint eyed person
diSTi
Look, View
kisur
Evil eye
roppO
Eyelid
gavlO
Cheek
gaalu
Cheek
kanasul
Gill
kAn
Ear
nAk
Nose
sogi
Back of mouth
gaalu
Jaw
cipu
Chin
hruDi
Gums
taLu
Hard palate
jiip
Tongue
huTTO
Saliva
dAt
Teeth
geLo
Neck
mAn
Back neck
khAndu
Shoulder
ghaDi
Throat
hOT
Lip
muskuLi
Philtrum
mucungu
Mustache
dADi
Beard
sovram
Haircutting / Shaving
snAn
Bath
Angu
Body
tanu
Body
piLo dAette
Pandiculation
chASTi
Strength
jiiv
Life
keNDO
Skin
kAk
Armpit
hAt
Hand
khobo
Elbow
kOSTu
Forearm
kangro
Wrist
taLohAt
Palm
peLLO
Deep cut (in Palm)
mUT
Fistful
cUL
Hand scooping
anjjili
Five fingers touching each other
rEgO
Palm Line
angiLi
Finger
hakuNDo
Thumb
tarjini
Index finger
mhaddiangiLi
Middle Finger
muddi angiLi
Ring Finger
kiLAngiLi
Little Finger
bOT
Inch (Width of index finger)
viidu
Span (Distance between thumb to little finger)
nekku
Nail
gorucuTTu
wart on the finger
neram
Vein
hEm
Chest
duddu
Breast
guNDE
Heart
monnu
Mind
moLi
Knukkle
ciDukku
knuckle cracking
kET
Hip
pAT
Back
pOT
Stomach
antro
Intestine
bhombi
Naval
bojje
Tommy
gAN
Buttocks
lingu
Gender
guLLu
Penis
buDDo
Pussy
maTi
Lap
anku
Lap
uuru
Thigh
pAynG
Leg
guDgo
Knee
jAnGgu
Ankle
ponGgu
Hindfoot
palaDi
Heel
guDgAEl
Heel
taLopAynG
Foot
haTkO
Bone
khovlO
Cough
poSSe
Common Cold
sigir
Sneeze
iski
Hiccups
degAr
Burb
kangLo
Bone
rekad
Blood
gU
Faeces
mUt
Urine
sumpuT
Mucus
gheraL
Phlegm
sego
Sweat
geji
Prickly heat
khajju
Sore
khAs
Itching
piip
Pus
soos
Swell
phubni
Bloat
buruDo
Blister
ghompiLi
Bump
syini
Drool
dUvu
Eye gound
pinJu
Earwax
pholi
Pimple
phulAphuli
White Bumps, Skin Tags
vamni
Vomit
timur
Numbness
vaccam
Handicap
inTkini
Sprain
pagul
Step
nhavan
Oil bath
hubbas
Suffocation
hOnGgu
Sleep
sovnO
Dream
doLAaddam
Specs, Spectacles
chasmo
Specs, Spectacles
doLAmpani
Tears
manjjan bhurko
Tooth Paste
manjjan khaTTi
Tooth Brush
duno
Pain
Anguhunno
Fever
doskAduno
Headache
hempini
Wheeze
kuNTentunneaa
Heart attack
pODDuno
Stomachache
hagguno
Diarrhoea, Loose motions
kAnduno
Ear pain
dAtduno
Toothache
mhoDoammo
Smallpox
ammo
Chickenpox
teTTu
measles
kanje
Smallpox
rOg
Disease
mhoDo rOg
Leprosy
khOT
Leprosy


Kabir Dohe in Sourashtra


dagDo pujakeri hari miLetii mii dongaruk pujo keru. tye somar hokaL bhalO, lubhi khaayi sansaaru.
paahan puuje hari milE, tO mein puujuun pahaar. taate yE caakI bhalii. piis khaay sansaar.
sondo kernasette hindo kEr, hindo kernasette atho. kshaNamu pralayam hovaaiyi, uraav poDayo khobba kerai?
kaal kare so aaj kar, aaj kare so ub. pal mein pralaya hoyegi, bahuri karoge kub
tILum kOnak tEl shE kii, dagiDam kOnak huLo. shE kii tore dEv tore bhitar shE, tuu jagan sakEti (musEti) jaagi (jagilE)
jaise til mein tEl hai, jyon chakmak mein aag. terA sayeen tujh mein hai, tu jaag sake to jaag
matti vacasi kumbhaar sIy, tU kaay kusurai moko, oNTe dinu isa avaiyii, mii kusuru toko!
maaTi kahe kumhaar sE, tU kyA rOndhE mohE, ek din aisA AyegA, mein rOndhUngI to.hE


Rhyming Words in Sourashtra


kavlo/kavLo/gavlo
creek/crow/cheek
gAi/kAi/khAi
cow/what/eat
mhuri/miri/muri
Mustard seed/pepper/dirt
kAT/gAT
cut/knot
chAl/jAL
go/burn
kAs/ghAss
coin/ball of cooked rice
thUv/dhUv
spit/rinse
kAm/ghAm/gAm
work/beat/city
thAm/dhAm
place/run
chiiv/siiv/jiiv
peel/sow/tongue
abbi/appi
found/smear
pAt/bhAt
fart/rice
kAn/ghAn
ear/Odor
kAl/khAl/gALL/ghAl
yesterday/under/scold/put on to another
kuLLo/guLLo
short/yarn(ball of yarn)
ghAT/khAT
mash/buy
kAn/kAN
ear/pound
poraT/moraT
washerman/rowdy
hunno/unno
hot/less
kET/khET/hET
hip/ boil/pickup
hanDi/handi
Frying pan/cook
kEr/ghEr
do/house
sikko/sigo
learn/hanging pot
vawri/vavri
fan/use
sejjyo/sijjae
next to/boiled
keLo/geLo
banana/neck


phaila pustav - Prof. Ramarai


sanAnGgu
One letter word
diidAnGgu
two letter word
sondo
tomorrow
tikrAnGgu
three letter word
avAru
hostel
vAsun
residents
bhodirin
dancer
uclAvu
earnings
Adaro
support
sahAvu
help
aTayaeti
thickened
marAmaru
fast
savasu
companionship
cEkpani
muddywater
huGkilattae
sprinkle
nekpani
clean water
Elana
light
phullandi
previous day
niSTaru
seating
anusaraNo
acceptance
paripAlano
fostering
aparaimito
unlimited
upacAraNo
hospitality
pariSAEcano
sparkling
abhivAdano
welcoming
upakaraNo
apparatus
pariSOdhano
experiment
adhikaraNo
categorising
nirAkaraNo
cancelling
visAESaNa
special
visESaya
noun
ghErupoTLo
roof of the house
kilnAsaerpaNi
key bunch
nhennahovrin
small rooms
aLTAsaTo
attic ladder
mhoTToviDi
big windo
dArulAgu
front entrance
dArukiilu
hinge of the door
uncobhiitu
ceiling/tall wall
hAtubhiitu
parapet
kavADukhiilu
door latch
akrAphAvu
foyer
ghEru
oli
hugro
khoTTo
umbrA khapuro
tiles of the room
laguDAthandili
torch on wood
hollohoLTo
upper porch
hiipuviDgae
brick for floor
khAmbu
post
covipolko
wooden desk
vanGkTo dhuNTo
crooked wood
tikrokASTu
third area
tikrovATu
third entrance
ghirAhiiru
deep well
hiirunako
pulley
nalAyipani
tap water
paesuthowli
bowl for starch
munGkrA peTi
spice box
kasAthaLo
tin plate
deguDApaTo
grinding stone
dhOlUpLo
pot for mashing
neddijhawru
flow of river
dhuNTAhokaLu
wooden mortar
kailAlAnGgu
the branck with buds
taLAtiiiru
bank of a lake
voNDAmusaLu
grinder/pounder
musLuvOvu
the round tip of the grinder
gAyigOSTu
cow shed
cakibeLo
round grinding stone
mattimveLAvi
sand mixture
iirugaGiDi
pot/vessel
gorusinGDo
bull horn
bhittaru hoTAru
inner courtyard
bheysudamo
snout rope
divAvAtu
wick of the lamp
liitudivo
brass lamp
laguDAbharo
bundle of wood
divAkhaTTi
match stick
vistaevupeTi
match box
tElu gagDi
small pot for oil
saestra vidyo
weaponry training
sAEstro vidyo
academic training
dhASTi
strength
giriDi
sports
phuLLo
before
khawri
pond
tirattae
swimming
taLo
lake
dhuNDattae
swimming
bAlyam
childhood
yawwano
youth
daSA
period
wArdhikya
Old age
huroddi
school
igattae
studying
saek
class work
tuNTavatto
gossip
pantura
competition
mampu
students aid
lanGgaeti
passing
jEmu
reward
samTayi
will obtain
dastu
fees
tumro
attention
numpulunAtto
not drooping
poti
book/palm leaf
porAEksanAtto
not looking around
cittu
focus of mind
vidyAEwi
erudite
trANi
capability
camatkAr
modesty/bright
juDDayi
will acquire
andhu
blind
rEmu
department
viratir
retirement
pAmsu
pension
mantu
competition
phuDka tuDka
miscellaneous
nugattae
commodities
tAk
buttermilk
kheras
cheese
hEru
saddle
pawsula
briddle
kEru
comb
bhoraNi
small box
cAkudANu
handle
kowtuka vastu
decorative items
khOru
hoof
sijvaeti
when boiled
vajradiDDu
glue
khEtu
farm field
mastu
fertilzer
lumayi
will chew
cuvunAtto
without chewing
gilin
swallowed
oLTokoLTo
now and then
tadi
system
potulo
part of a look
ghuSTi
roll/ball
khunayi
roll
kAnti
radiation
mhaeDi bheNDu
sheep
tTuccho
tiny
saeLi bheNDu
goat
praenJjo
intelligence
ghOru
uneven
donGgaru sinGgu
top of the hill
sAElwo
shawl
kambuLo
blanket
muyi
camel
cikNAru
lean ones
khaowNam
food
koNDo
fine bran
saerki
cotton seed
simbu
grains
pAENu
oil cake
nawsu
grass
candijhADu
silk cotton tree
kELujhADu
banana plant
kELu tOmu
banana bunch
daeLi bhairi
gram flour bread
pAEsu tavinkini
boil the paste
tEkujhADu
teak tree
oLaena
gutter for rain water at courtyard
kOSTu
wooden bureau
dhuNTo
wooden stick
hudi
termite
nasAtu
loss
nElu
entrance door
ghano
mill for oil
rettu cAtu
axis of a chariot
amTi
gravy with tamarind
timTi
vegetable gravy
iimu
seed
dugvALu kAlu
troubled times of femine
naesi
crushed
puSLo
astringent
toran
garland
cakulattae
side dish
sAEkhu
branch of a tree
sipun
trunk of a tree
rundi
breadth
khyAEti
famous
siin saemullattae
resting
sailu
shadow
piculu
cage
damaru
lotus
nAlu
fiber
tAkkhaDi
treaded
valkalr
made of lotus fiber
candi
silk cotton
pinGji
ponattae ripen?
loLpin kaNattae
moisturize and pound
tAkkhaDattae
spin
kawso
silk/bunching
kawsulo
silk saree
sAElu
sweater
sAlu
scarf
nhansulAnu
half saree
dawji
make an attire
cikuDamatti
clay
ceDwin
export
piiku ghalasun
planting seed
buso
shell/fiber
naelum
press
ghindattaer
binding
mUsimu
bottom
phEpu
coconut leaf
midduhoyn
budding
naraeLuntOmu
flowered coconut
sonduru
sea
ghiir hutri
deep rooted
diivu
island
naraeLu hAku
coconut farm
sonduru sovaT
sea side
gAEkumu
around
tOslaenGgu
top
kaLvani rEsun
dark scar
prAlu
more than
phEvu
dried coconut leaf
taddu khapuro
strong shell
khuri
coconut shell
dii bOTu
two inches
bAlu
coconut husk
Kawnal
green coconut
sawnal
mature coconut
mOvu
measurement
juni
ploughed
Uvikurae phara
after germinating
naraeLu khOru
sprig of coconut
uvvaen pajaentE
harvesting as needed
juDkae jhADu
aged tree
naraeLu ghOlun
bunch of coconuts
aLa
garden plot
khaNDi
pit
mOku
sapling
dhEku
baby coconut
poslo
rainu season
phOLu
produce
hunaLo
summer
dhAru
bud
juNan nikuLaeyi
starting of bearing fruit
siirasi
seventy to eighty
hiiDujAnAtto
without rotting
bhoNam
part
kANDu
stem of a leaf
paruDo
coconut fronds
paruNDo
dried leaves spun
khOsu
stump
tEmu
coconut water
suro
white sugar candy
hosto
west
khanaTi
crowbar
naraelu phEpu
coconut husk
phippi
dust particles
gonae
wound
loTni
sweep
hinGgADu
export
neggun
nibblets/snack
induvaenGkini
for frying
kSaruDo/kharuDo
soap
miti
boundary
khaslA jhADu
date tree
tALu jhADu
palm tree
ramArami
almost
parun
others
sAmati
proverb
biiju
seed
anGkro phuTTuvaen
sprouting
dustal
rare
marmarAsu
rustling
tunju
palm tree
tuDka
palm fruit(young)
tumphal
palm fruit
yaSTi
stick/rod
tALu buLLAn
palm sprouts
deLae piiTu
gram flour
dallanGku
male palm
ramo
parrot
hintALu jhADu
talipot palm
huppaLu areca
nut palm
khasuLu
date tree
lAni
not able to
Khiisu
date
vaLurAN
sand dunes/desert
kAntAr
desert
bhaeLi
very
paNaitu
trader
lindasun
sell
loDi
droppings
bhuslA jhADu
black date palm
bhiisu
edge
kiisun
monkeys
mUsi
sharp point
puDki
basket
paNayi
market
puLindu
merchant
cislA dOvu
grocery
handait
cook
chislo
grocery
raslo
vegetables
tiiku
red chilli
phumpu
anise seed
iiru
fennel seed
dhAyi
coriander seed
baddu
spices
dollo
yellow fruit
budno
mint leaves
muLco
radish
asturu
Okra
gavuru
carrot
ambuno
small/star gooseberry
gulbuLLo
sweet potato
dhulbuLLo
potato
hustandu
parboiled rice
kuLitu
horsegram
siLamu
moong
dhOru
lentils
phiilu
white sasame seed
ghOmu
wheat
phOmu
semolina
lhaegUvru
easily
rumattae
cud chewing
ruDHi
habit
kAntAru tAru
desert ship
pAntun
travellers
dudUru peyno
long journey
pijattae
to travel
lindaitun
merchants
ghiisu
dates
ghidili
by folding
vATsArvo
journey/passage
khoLTo
gunny sack
bhorivilin
by filling
guLLo
ball
kagDo
hump
mando
fat
bhovAEdi
many days
aTainu
by shrinking
vasattae
to reside
vasansaekkuna
cannot live


avatArik0 - vacana rAmAyana


avatAriko
foreword
sUnu
son
nisAcaru
demon
phailAdi
etc.
suLum igi
read/write easily
labuvaen
to gain
bhunGguvaen
to enjoy
nugilAEtim
having used
nimpi rhiyae
been printed
bhiDilin rhiyaettisA
having been accepted
hAru
consonant with h sound
nAku
nose(nasal)
haddu yakAru
half vowel of y
jiiva tanu rUpun
vowels combined with consonants
pOku
page
nuvularaesi
humbly proclaiming
hUNa 1940 orsu
1940 AD
viSayAnukramaNiko
index
khArir
in the world
bhiNDili
with belief

bAlakANDo - vacana rAmAyana


vivariNi
explanation
tirak
coming in front of
gaeginu
having gone
phuLLo
past(time)
tuNTakAmun
aggressive actions
poDatun rhyae bAdhAnu
the undergoing troubles
dAnavun
demons
mAru
war
mon hausuru
being mentally happy
bhoritAnGgu hoyli
ecstatic
kamalAsanu
brahma
danujAku
to the demon
vinjci
brahma
pori
having requested
tigo
enemy
nasAtu
harm
apul hamsAmu
their heredity
rAjAnGgu
kingdom
bavuno
consider
lAEmunu
ladies
paricAru
service
mAEsun
eyelids
juDaLLiyaesi
received
etinu
by making effort
rEm
place/shore
paDabAkhni
flame on the sea
panjcAsanu
brahma
vairAgyu vahili
having determined
oNTiis
only one
mahOnGgrusara
overcome with wrath
swAsa bandheno
holding breath
hApti
sacrifice
sonnA POTu hranya garbha
(brahma)
diivano
bless
santuSTi (trupti)
content
paramESTi
brahma
jiguvaen
to succeed
mAnavun
humans
nityAnantu
infinite happiness
nitrAnantu
happiness of sleep
nuti kerilAEtunu
praying
bhinnu avnAttiso
impartial
padmAsanu
brahma
antaranGgu hoyaesi
vanished
dasAnano
rAvaN with ten heads
kinnarAesu
the head of kinnaras(devas)
lakSmii kaTAkSam
blessing of Lakshmi
vasu phailAdi
vasu and the others
ravaNo
making someone cry
kinkaru
servant
pitAmahu
brahma
sonduru tiiru
seashore
vArijAsanu
brahma
sAkhAmUgun
animals( monkeys and other of the kind)
bhallUkAn
bears
hOku
order
jai landyAEsi
they reached
diisukulamujA prabhAvu
the greatness of Surya dynasty
srujaesi
He created
anAvruSTi
draught
muginu
searching
bALu bOLu
blessed with children
diis ujAvumu
at sunrise
paramAnnu
sweet porridge
bhUsurun
brahmins
yathAkrama riiti dhAnuku
formally(traditionally)
vAsu sinGgunAAttaeno
man of his word
lucvinu
spilled
dhaeri giltakan
they will catch and eat
gidili
being sad
khiNa khiNaili
shaking(shivering)
bhUpAl
king
thikili
being scared
jai landinu
having reached
vanJjuLo
bow
bANo hilkauli
fixing the arrow
deguDo
stone
bhittarApanum
private room
kanakapiiTho
golden seat
kusalun
wishing and inquiring
dhaDDinu lAEtanaDi
sent and having fetched
dakSaNamu
same time immediately
ravaNayattan
arrangements to start
dAdidAstunu
maids and servants
avArun
rooms
myAra
gifts formalities
sigram
dowry (gift)
mukuL hasA tONusara
having a smile
tuNTili
happily being gleeful
bolam uDgin rhyae
being weakened
niiti tindunAtto
being lawful


ayOdhyA kANDo - vacana rAmAyana




silpa sAEstriku
architect
dari hoy
will become a slave
durbhOdhano dumae vEnGgu
poisoned her mind/ sowed bad oats
jaTAvalkalu dharili
In disguise of a saint(hair and clothes)
dhiimantu
wise person
hiiDu
ruined
vatto sinGgunAnu
will not forget the promise(men of their words)
niisu lukkinu
night was over
tEk silAEtun
anticipating
ullanGghinu
having trespassd
vAgdAn
giving word
monnu harSili
mentally being happy
isna vattAku
for this small word
naTanALin
dancers
gOnuvAsu
clothes made of naturals
gAmu pawrunu
apsaras girls
giirghali
offering of sweet rice
guNDae
kampili heart beating fast
bhUjA (born of earth)
SiTa
bhUSu vAsAdin
ornaments clothes etc
sara sarAsanun
bow and arrows
palkhu vATu
footpath
janGgu kaLaili
having found the way
pallaenu
villages
kulyAEnu
waterways
lanGgi
crossed
teknGkLo tiiru
otherside of the water
amAtyu
minister
putra sOkAbhrhani
sorrow of children
heta lagi
being sad/shocked
rOdana kaeri
mourned
rajAtanu
dead body of the king
hiDai jAnAtto
not ruined
kaLAEbaru
body
kkOnsata
east
khaTvo
cot
pavipoDae soko
like hit by thunder
rAjAnGgu halgunAru
one who reigns
vistaew siraLLAEatu
furious like fire
paTTA sUri
huge knife/sword
vumsili
having drawn
durvinu
removing
rAgu dhumsili
controlling anger
kisokivu
how would I ask
dwandun tuTTaesi
broke up the relationship
lOkAntarumu
to outer worlds
nislo
night
nikhila
every
balun
warriors
guSTi
vehicle
phovunappan
hospitality
sowmitri
son of sumitra/ Lakshman
jun dhULi
smoke of dust
kAEnun(kAEtun)
flags
parivArun senGga
with the army
loLpayinavae soko
like rolled in/like dipped in
avaraetteno vinAEka
not only the one coming
daNDa praNAmun samAcArinu
having done obeisance
ankuru
on the lap
sosti hA?
Are they doing well?
cintAkrAntu hoyli
being worried
janJjulAEt anilli
bleeding
jiinu
garden
mantun
opinions
pawgaLun
foot wears
haraLi betkae
head of kusha grass
khuTTaguta
to pluck away
saraNam dEhi
give shelter
doLA diruSTi
eyesight
lanGhaDi
making the other to cross
anunjJa
order part from


AraNya kANDo - vacana rAmAyana


Ascararu
with surprise
vadhaesi
killed/executed
Adityam
hospitality
akSayatUNi
perfect sheath of arrows
kAntAru
forest
kindlo
fruit
muLko
root fruit
kONapa
demon
khaWNamun
snacks
dAt khiTakiTailinu
grinding teeth
jhunGkul ghallAEtun
walking with a hop
lAni
not needed
prAk sogan
like before
legin/lawlae
marry
visi poDi
frustrated
bolvanturu
by force
disAnuku ulkaDattisA
shaking all directions
laDai kervaen
to wage war
luNTilAEtun
swirling
pAro nhiitto
without shore
hELana
tease
tindulvAna
cannot delay
tenGguDo
the other side
nudhni
fighting
borkattAAEttisAn
growing
duslo
other
suratu
valour
yAEstadim
right at this moment
apuDus sA
I will kill and swallow
dhanuSTankArun
noise made by pulling the string
kAlAntu nagariku
to the city of yamA(death)
bhunGkulan
in order to adjust
prayOgaesi
made use of
danjAdhipo
the head of the demons
khaTakhaThAyina
will shake right?
janaDuta
as soon as proclaimed
yattiku
even now
bhU baeTi
Sita(daughter of earth)
swatantri
one who acts as he wishes
dhannu hoyaesi
being thankful
sowlunAttu
intolerant
kasA rettun
chariots made of metal
kauturu
by trick or being playful
kamulatthebba
when requested
haraNAdheri
to destroy
ulkaru khawjulvAi hA?
will you scratch yourself with burning firewood?
nasAtu
destruction
kAlAntu
God of destruction
jhAgutkili
frothing mouth
kAnjcana harin
golden deer
vanGkLokinu piilu
bow and arrow
jhajhADuku
tree to tree
Uhanakaeri
guessed
piil vinduta
as shot arrow
ciNili
grumbling / angered / frustrated
khUruru
with anger
vekkuLo
along
kopaTu chALi
shrewdness
kivaesu
she/he told
hiran
harin
bhukkosukko
you all be hungry and thirsty
silmo
difficulty
kombLo kAntu
young girl
pragyAEtin
fame
nijarUpu sA
see real form
hapALu hiiTum
by air
camatkArin
possessor of enormous energy
ghAru
vulture
heDi soDus
I will release
piiT kaer taidu
will beat to powder
piiT
powder
muskiLi
beak
khAlapiDi
rolled on the floor
katko vumsili
drawing the sikkil
pinjJun
wings
kulakulailinurhyae nAdun
happy sounds
bhUSu
jewelry
khadiri
bundle
donGgaru biNukumu
in the cave
rhgan thovi
having secured
dOSNA?
is it not a crime?
kOmali
young girl
vilapinu
fearful
kunJu
garden
lukki
hidden
mUgunu
animals
humbhrAmu
in the room
bhavad dEviku
to your wife
rekat vamilAEtu
throwing up blood
auraevanno
for us
ambrauni
our visit
kawri
demon
mowjaili
aroused / out of control
vanya vastun
things of the forest
onjciln
scooping up
anGgilin
accepting


kiSkindhA kANDo - vacana rAmAyana


gaeriSTunvO
elders!
rAjaSAEkharun
best of kings
sawnAru
administrators
polanGgu
monkey
sacivu
minister
kapi
monkey
sandhi kaeri thowi
arrange to meet
kAmun phulattiso
to accomplish
tiiru lanGgaesi
reached the bank of the river
saunikA
must protect
hawsAnGgu borili
elated
khAnduru
on the shoulder
sostiru
in glee
vAnara yUthAgrEswarA
leader of the army of monkeys!
AnGgu senGgAnGghupili
hugging/embracing
bhikitakae
thrown
kSAtru
enmity
vAnara punGgaVU
Head of the animals
lukkaTTinu
having hid
inakulAEsA
the head of Surya dynasty
vindyAEdriku
to vindhya mountain
tarkili
argued
kSipaesi
he/she threw away
nimmaL hoyi
having attained peace
toN vepili
Drooling
bhidili
splitting
tUNiiru
caddy/sheath for arrows
saehnikarluno
have forbearance
nivilAEtun
praising
raNanarnGgu
war field
muSTi ghAmun
punching with the fist
tonjJcuta
drill hole
dhillo keraesi
he/she/I caused hurt
dhiTavun heDaili
having weakened
dustal
difficult
chinkitakin
pushed off
yuktamkii
is it alright?
cUk vAkun
mistakes
hAt liyaesi
took over
tONapiLLAEtun
saddened/tapping on the mouth
nAdikOnu
Who is there to care?
jivilAEkun
bless you
vartilAE
behave
muktu
liberated one
parigrahinu
having received
vanawkAdhipadippan
title of being the leader of monkeys
pramukhAnuku
to popular leaders
carunuku
to envoys/servants
mowjaD
pride/arrogance
sarAvu
arrow
AnGgu lombaLLi
being limber/feeling low
mannano hovaDailuvAyi
can be pardoned
kiisupaLAnuku
the monkey warriors/camp
miLAvi
gather
baramaelli
being in acceptance
mELum miLi
assembled
bhalAn
spears
sUlun
tridents
mOvuku
in count
mitamiti nhiitae
unaccounted for
bhAlun
bears
pulkili
being thrilled/blissful
siitA anvAESaNo
searching for Sita
khanvas
east
sikSa keraDu
wil have them punished
hosta
west
nadunu
rivers
khETunum
in the villages
donGgaru tarinu
passing the hill
kisAn tAETaski
all over
cittu kawlaili
mentally disturbed
gatAyu hoyaesi
died/passed away
taegiccaru
by itself
dhiTavu
strength


sundara kANDo - vacana rAmAyana


kawtu
excited
jaeyasAli
winner
chailo
shadow
karae tamulai
the action will be delayed
lambahOnGgu laiDyaesi
died/went into everlasting sleep
durugu
fort
dagura hAturu
by left hand
marsilAEtun
being in search
niriikSili
searching thoroughly
sOdhana
searching/testing
surApAyin
drinkers of alcohol
bOlun(bolAn)
ornaments/clothes
madanasadanAn
entertainment halls
pAvani
will be sinful
naEndrukae sAsana rhata
when there is the order of the king
badularu
on the cot
viikSinu
having looked carefully
pokkAmu desili
clinging very closely
khatAyunu hoylanu
will die
rADappan
being widowed
avanijA
Sita/born of the world
sEguhalvilAEtu
shaking the branch
kupili
being angry
tuNo/truNo
spec of dust
mAnasa kawrimu
in the lake Manasa
utki khAttae
the one grabbing and eating
tellu deguDo
piece of rock
tON usvaDasu
putting word in my mouth
jhurinu
slurping
kawriNi ontunuku
to the demon women
sadiSTu kaiki
which may happen soon
jaeyapradam
the one which will give success
dhAtu solin dekkaLLi
exposing all sixteen teeth
ghorkul khallilAEtu
snoring away
rhanolAEkun
let it be
somsilAEtu
doubting
paLo vawlinu
wage war
bhurkka taeno
small person
bhiNThuvAna
cannot believe
diivano
bless
baro
fine
vanabAlakAn
forest rangers
toranu khAmpu
post for garland
samakSumu
in the beginning
vanabhanGgu kaeri
destroying the forest
sunGgilin avAEsi
they escaped out
hatasESinavi
arrived those left alive after all the dead
pabni phaTaphaTaLLuta
having eyebrows throbbing
karaemvandi hOttiso
to be trapped in the prison
vanawko
monkey
kAmukawna
not usedful for action
vajru
trident
ujvAvu dhiTavu
born valiant
pratinjJo
promise
nirAkervaenu
to waste
jhiinu
flower garden
tikulAku
to the enemy
dUtAnu
messengers
priituku lagae
lovable
jati miLi
gathering into a group
nikkinu
having decided


yuddha kANDo - vacana rAmAyana


paLo vawno
should wage war
taED hoti
staying there
praNitin
messengers
cawkuru
on the seat
aTaDinti / lanGginti
making it dry or crossed
porAku / hotae hAlimu
without being cared for
miti / kAyi
nothing to compare
kiisu
monkey
bOdhano
preaching
nuvasu
you praise
kAnkuskattiso
so that will poke into the ears
hitaw
comforting speech
sostiru / sawnilAEt rhiyaeti
if rule comfortably
hawsu
glee
kupnAtto
without anger
hubLo
flame
ghUkunu
owls
kholAnu
foxes
mawjaD
ceLyaesi has become arrogant
dus
sakunun bad omens
sObhano
wellness
mUsun
mustache
mankhae hAl
since requested
jhainAm hotae khaDgo sikkel
that was in the holder
kAnum dailnAtto
not listening/not hearing
kamaeti meLLi
even if requested
doLo misno
blinking
thapAn dherli
holding bamboo posts
khnjcilli
dragging
nikku
faithfulness
caDAvu hOyi
will be great
bhavAbranim buDirhyae
the one deluded in sin
lanGgaDattisA
able to cross across
sama damadisadguNNun
equipoise like good virtues
bhAnu kulOtttamA
the wise elder of the Surya dynasty
sarvapradA
giver of all
owmae hAli
since made ashamed
hanmantu kOD
looking at Hanuman
sikSaNAkubAdi nhAttaeno
not worth to be punished
dosko nimbaLLi
stooping head
hAtonjJili
folding arms
dustal
rare
voranu
boons
kAraem
in prison
yuddha naipuNya
skilledto wage war
marumunu
secrets
vekuLo avi
coming alone
tenjJi
once upon a time
bhiruTTakan nA
will they crush!
jheTpini poLLai nA
will be snatched!
apurUpu
rare
vanJcanA riitiru
by trickery
deNDaeno
punishment
parvat kerilAEtu
condemning
pasuku
to animal
AvirbhAgu
sacrificial
morisilaeti
if being unfriendly
jigAttae
winning
sEtu
bridge
darbhA hatran
bed of kusha grass
maddu hutraDusu
I will tame the madness
bADabAnalakan
fire of the apaclypse
nakru
crocodile
kirvilu
crab
timitiminGgilAn
whales
kovdAn
shells
siipun
sea shells
vADDevusu
I will let you go
tirayi
will float
jhANNu
trees
neddi rajo
king of rivers
kawsunu
clothes
vilAsun
width
lambo denvaD poDinu
prostating
tirADi
help to pass
mejwinim abbunA titko
countless
hitavantun
benefactor
cAr bhranim buDvaettisA
the one dipped in four seas
aLa bhandili
having built a dam
chaTana soDDi
out of being distressed
aduSTu
fate(luck)
tEThAm
to that place
dhaTAggopuru
the sheeple of the entrance
gada
mace
durkhOr
on the fort
kSaNamavo
come in a second
biig tagi
locking in
kingGkaro
servant/stuntman
worpi
scratch
rekat bhombaL
to make blood ooz
savasu
feat
bhandigAnAm
in prison/confinement
sariiru thumputa
when moved the body
regdaipoLyAEsi
were crushed
samukhAmavli
appearing in the assembly
cuTTu ghalliDyAesi
surrounded
paLAkhinGgADi
forward the army
sawdhAn
houses/ palaces
samOru
fight/war
haistAnu ghiimkaru
trumpeting of elephants
ghoDAn hESo
neighing of horses
saeLi
bheNDu goat
upAEkSu
hOru carelessly
prAkrutu
ordinary man
pakSirATu
eagle
markaTun
mondays
virathi
without his chariot
huTTi poDi
being angry(screaming)
dhASTi sawusu
I will check the strength
mhoddi rhiinu
placed in the center
candhi kaeraDai
guiding to meditate
nhuru
precious son
kantiirun
rare arrows
julajualaili
glittering
vinjcArun
white fans
mUTudiyaesi
punched with his fist
mUsal samili
awakening from unconsciousness
bhiikara
sakti vinduta when shot a terrible arrow of vigor
ruppA donnGgaru vavae
the one lifted the white mountain
amsAtULi
khaTvo
ulu
owl
khunduta
when tramped
piiTha
seat
hiirumu ghiiru sAnavaesAE?
you came to fathom the depth of the well?
kErun
weapons
pATum kernAtto
carelessly
okul soko lombuta
hanging like a bat
ApaNAdi
the marketplace
danGka
carrier
giirvANun
devas
deguro hAturu
with left hand
kSitiru ninGke vEnGgu
as beaten against the floor
hiisu mitim
in count
jhADu lAgu
wooden rod
hupAwu vattAn
wisdom talks
jundhULi
into pieces
kaswArUpu
form of a turtle
krODArUpu
form of a pig/varaha
narakum luNTaetteno
he has rolled in hell
cintattaemo
in thinking
ghAyun
wounds
akSimu
in the eye
khOn
east horizon/East
dahilAEtun
when burning
dhUmu phOkunu
clouds of smoke
khaTli
having taken
lhovvo vAsu
red garments
daNDa kOl
sceptre
khalpo
tile
tigathaevili
having enmity
vidhAtu
Brahma
mono jiyae sUri
blunt knife
khOn sata dhaTAm
in east entrance
sAkAmUgunu
animals on branches
pawmAnu beTo
son of wind god hanuman
nisTtAdhamA
you mean demon
pascima dhaTAmu
in west entrance
prakrutin soko
like unlearned
dosko kamilinu
holding head supported by one’s hand
para kAntu
other’s wife
hEmu rEmmu nikkuthevi
aiming at the heart
hatu hoy
being killed
jAlu
net
pAT hoyaesi
was ruined
hiisu(mitim)
count
madakunJjaruku
to the mad elephant
hEmastun
bones of the chest
sESAEmsu
Lakshman
eko cUki
escape from this
nawru
on the throat
pan rAEsun khaDili
weeping/tears rolling down
thiinsani
three eyed god/Siva
pajente
wanted
pan dhArun khaDii
dripping down tears continually
taLahAtu rEsunu
lines of palm of the hand
marut putru
son of VAyu
aravinduku pandhOdayu
friend of lotus(sun) came out
damarALi
lotus pond
agAdhaghiirukae
unfathomable depth
sowuLo hOttaekalentu
until sunrise
vATu singayaeski
am I lost
niisu gamDiti
after spending the night
siinu samilinu
after recuperating
sOku samiluvaen
to quench the thirst
khawri
pond
apsarALi
heavenly woman
apsara lAEmu
heavenly woman
siDvi dhaDDuta
ordering off
gAlaru
on the cheek
jegano
right side
sinGgun
horns
diis ujulan jAsu
Sun is going to rise
pavanAtmaju
son of the wind Hanman
langhaetteno
who crossed
paramAnnu
sweet rice
darvi
the ladle used at the yAga
janakajApati
husband of Sita(RAm)
mhalvinu
quenching the fire
siraijavaen
to shed
taskaramaNi
head of plunderers
halo
plough
vinJjcu
scorpion
hEmastin
bones of the chest
hutAsanu
god of fire
vahni
fire
bANa jhanjJu
rain of arrows
pAkasAsani
Indra
pAkAri
Indra
banGgi bisinu
kneeling
thigin hibbuta
when wondering
saciipati
Indran
dharaNijA
Sita(born of the world)
marutAtmaju
son of Maruti
mANAntAni vairANi
no more hatred of the dead/ end of enmity
tiirthun
holy water
sibiko vavaDili
being carried in a palanquin
tenGiisi
right then/ on the same day
laguDo lAgun
wood stumps
lAgugunGgu
heap of wood
taLahAtambLo soko
like a gooseberry in the palm/obvious
abhrani bhanGguku
to the broken banks of the pond
bhaTu
servant
koduva nhiitto
not less
krutArthun hoyaesi
we have completed the mission
diigaL Siiru veLLam
72 thousand soldiers
bhOmati
reward
mArtAND udayumu
at the sunrise
apulanGkuru
on his own lap
ruppA daNDu
silver rod
praNaman
namaste
gunGgugunGu
bunches of people
karoghali
having paid taxes/adorn
raDvippan
widowhood


naviina saurASTra


ankro
sprout
awsu
clothing
kAntAru
forest
kawtu
fun
kausu
silk
kaunal
coconut water
kharuDo
soap
khOmu
strands of thread from plants
khOru
hoof
khOsu
shell of coconut
kawri
pond/pool
guLLo
hump
gOnu
strand of fiber from plants
ghandro
bundle
ghiiru
depth
ghOlu
sprig
cEku
dirt
cikna
swelling
cAku
knife
chOwu
long leaves of a tree
jEmu
reward
jhAru
flood
tAgu
butter milk
tAru
ship
tiiru
bank or shore
thiiru
definite
tOmu
bunch of fruits
tOsu
top
dhuNTo
trunk/piece of wood
dOvu
vendor/shop
dhAru
fruit of a tree(coconut/palm)
nalAyi
bunch
nEku
clean
nElu
press for cotton bale
nausu
hay
nOgu
help
pantu
oppose
praenjJo
intelligence
poti
record(in a palm leaf)or book
poLTo
roof
phAvu
foyer
phEpu
dried branch/bark
phailo
first
phailAti
etc..
phOku
table
bUru
mat
bhari
big
mamul
tradition/practice
mANavu
student
middu
dense
mUgu
animal
mUsu
top of the hill
maeki
but
rUDhu
custom/habit
rEmu
shore
rEsu
line/variety
lAgu
scoop up
lAnGgu
bridge
vAlu
bark of a tree
siyli
step
saevvaTu
side/edge
sovaTu
side/sea shore
sounal
fruit/ripe whole coconut
habbu
insect
hAku
garden
hinGgADu
export
hutrADu
import
hUru
school
hEru
thing
howri
hip
kSaruDo
soap
gAyi
cow
bhaeysu
bull
bhaeNDu
goat
kELu jhADu
banana plant
kaccambA jhADu
mango tree
ciisu jhADu
tamarind tree
ODA jhADu
banyan tree
candi jhADu
cotton plant
naraeLu jhADu
coconut tree
tALu jhADu
palm tree
khaslA jhADu
date tree
cislA dOvu
grocer’s shop
muyi
camel


naviina saurASTra (numbers)


oNTo
1
dii
2
thiinu
3
cAru
4
pAnGcu
5
sO
6
sAttu
7
ATTu
8
novvu
9
daessu
10
vigyAEru
11
bAru
12
tAEru
13
covdu
14
phandaru
15
sovvaLu
16
saettaru
17
orADu/diivunnoviisu
18
yOgunno viisu
19
viisu
20
yOgaLo viisu
21
diigaLo viisu
22
thiinaLo viisu
23
cAraLa viisu
24
ponjJcisu
25
sOgaLa viisu
26
sAtaLa viisu
27
diiwunno tiisu
28
yOgunno tiisu
29
tiisu
30
caLisu
40
pannAsu
50
sATTu
60
siiru, sattatu
70
asi
80
navatu
90
sOvu
100
sOvuru daessu
110
sOvuru viisu
120
sOvuru tiisu
130
sOvuru caLisu
140
sOvuru pannAsu
150
sOvuru sATTu
160
sOvuru sattaru
170
sOvurasi
180
sOvuru nautu
190
dii sOvu
200
thiin sOvu
300
cArsOvu
400
pAnsOvu
500
sO sOvu
600
sAssOvu
700
ATsOvu
800
novsOvu
900
sasaru
1000
daessasaru
10000
laekku
100000


Dresses
boTTo
Cloth
phEl
Fabric
nAl
Fibre
tAt
Thread, Yarn
valkal
Fabrics made from Lotus fibre
kailo
Cotton fabrics
vET
Dhoti
kashTO
Traditional way of wearing Dhoti
cellaDam
Pant
cokkAi
Shirt
kampaL chokkAi
Sweater
saulo
Saree
kausulo
Silk Saree
nhansulo
Half Saree
kauso
Silk
pasuT
Silk
junna pasuT
Pure Silk
sAlwo
Shawl
sELu
Sweater
sADu
Muffler
SAl
Shawl
gaeju
Yard
podar
Saree Border
rhundi
Breadth
covLi
Blouse
govNam
Inner Skirt
nADo
Strap
sivi
Needle
dori ceNDu
Thread bundle
kashTipoTTo
Loin Cloth
kuTkO
Part of Saree


Ornament
murgaem khEs
Wig made of human hair
kuccu
Fancy hair accessory
sommu
Jewellery
jeDbuLo
Bridal Hair Jewel
toran
Hair Brooch Clip
suritu bindu
Sun shaped hair jewel
cendAm bindu
Moon shaped hair jewel
pimbaLam
Forehead Jewel
mirkAn
Side Ear chain
tavnaT
Ear Stud
sorae
Stud's stem
billo
Washer
tirkkaNi
Stud's screw
sALu kundaLam
Ear Stud worn by Kids
kundaLam
Ear Stud worn by Women
ponGgulo
Ear Stud worn by Men
jhunkaL
Fancy Ear drops
nAkutaLo
Nose Stud
mukkur
Old fashioned Nose Stud
billaak
Nose Pendant
namuttu
Gold lower armband
bEsiri
Nose Stud
gejjel
Necklace
aDgael
Necklace
deNDo
Chain
vanGgi
Gold upper armband
kaino
Bangles
kengaN
Wrist String, Bracelet
kedurO
Waist Thread
lecce
Cotton Arm band
muddi
Ring
modi
Pearl
binduLo
Ankle String, Bracelet
antel
Anklet
gosul
Anklet
ceympaTTe
Anklet
minjji
Toe ring worn by married women
addam
Mirror
dObu
Mirror
phonni
Comb
phonnO
Robi Comb
cAt
Scratching rod
boTTu
Bindhi
bhoraNi
Small round box, Casket
kajaeL
Eye Liner
cevni
Slippers
pawgaL
Wooden Slipper
kautuka vastu
Decorative Items


Marriage
jenjjem
Sacred thread
oDuvam
Sacred thread wearing function
sauNAl
Sacred thread Renewal Day
sontam
Kinship
devlay
Marriage Discussion
nigu
Finalize
dEshannav
Token Betrothal
mauDo
Coconut leaf awning
toraN
Leaf Hanging
khAmbu
Pillar
gheTTiviDo
Betrothal
pattirikke
Invitation
devukAs
Day before marriage
bhaulAs
Lineage briefing
horaaD
Marriage
leyn
Marriage
lekin
Marriage
muhUrttu
Auspicious Time
novro
Groom
novri
Bride
aTpi
Bride's Friend
dorimboTTu
Holy Thread
pAynjJ mudhi
Toe ring worn by married women
dhoNDo
Drums
nasurAl
Indian Wind Instrument
ghinkam
Cymbal
jeman
Feast
viDO
Betel, areca nuts distributed at marriage function
caturviDO
Betel, areca nuts distributed at marriage function
moskol
Morning sickness
ghevrAr
Pregnancy
ghevrarin
Pregnant lady
gerbin
Pregnant lady
vesani
Fullfilling Vow at the 5th month of Pregnancy
sAt mhaTa
Baby Shower
hovTi bhovratte
Baby Shower / Godh Bharai
jarkyam
Delivery
baLTin
Postnatal Mother
hindAL
Rocking
jovaL heDatte
A ritual in which baby's hair near ear is offered to God
kAn mindattae
Ear piercing
ghoNAm ghoNi
Baby crawling
goDTu
Infertile woman
muNDO
Widow
sATTu horAT
60th Anniversary
assi horAT
80th Anniversary


Family
ambO
Mother
bO
Father
ambulo
Husband
dallo
Husband, Male
beyl
Wife, Female
sovet
Co wife
beylmeni
Lady
dallameni
Man
dallanAcci
Manly woman
nuru
Baby
beDo
Son
beDi
Daughter
pillO
Kid, Child
bAlo
Infant
beTko
Boy
beTgi
Girl
jANu
Youth
javNo
Young
jAna bedko
Lad, Young Man
jAna bedki
Lass, Young Woman
mAi
Girl Baby
bavu
Boy Baby
mhaeTTataenu
Elder
nhannateanu
Younger
mamA
Uncle
phUynjJ
Aunt
nhannabO
Uncle
nhannambO
Aunty
mhoTTabO
Dad's Elder Brother
mhoTTambO
Dad's Elder Brother Wife
mamAbeTa
Cousin
bhay
Brother
bheyn
Sister
saLo
Brother-in-law
bhavi
Sister-in-law
bey
Elder Sister
bhavO
Sister husband
dadO
Elder Brother
bhavi
Elder Brothers wife
bhay
Younger brother
bhojai
Younger brother's wife
bheyn
Younger Sister
dovrO
Old man
dovri
Old woman
ainu
Grandmaternal
ainghEr
Grandmother's house
ajji
Grand Mother
ajjaepA
Grand Father
ammo
Grand Mother
aiyyo
Grand Father
mhoTTabO
Father's Elder Brother
mhoTTambO
Father's Elder Brother's wife
nhannabO
Father's Younger Brother
nhannambO
Father's Younger Brother's wife
sasu
Mother-in-law
sosurO
Father-in-Law
vesintin
Parent-in-law
jomai
Son-in-law
bhovNDi
Daughter-in-law
sorguT
Wife's brother
neyntu
Husband's Sister
jET
Husband's Elder Brother
jheDani
Husband's Elder Brother's wife
devar
Husband's Younger Brother
tevraNi
Husband's Younger Brother wife
mausi
Mother's Sister
mauso
Mother's Sister's husband
phooynj
Father's Sister
mamA
Mother's Brother
natte
Grand Son
natini
Grand Daughter
ponnatte
Grand Grand Son
ponnatini
Grand Grand Daughter
parivAr
Family
dampati
Husband and Wife, Couple
mhoTTappan
Respect to an elderly person
posunO
Adoption
diyadi
Cousin
sejjepojje
Neighbour
jAt
Caste
gOtru
Origin / Lineage Name
thOr
Generation
vanGgus
Ancestry


Kitchen
handav
Cooking
cullo
Stove, Ovan
laiDA cullo
Wood Stove
bhaunes cullO
Mud oven which receives heat indirectly
seni
Dung Cake
rAk
Ash
khoLcE
Coke
digaram
Kerosene
laiTo
Firewood
laguDo
Firewood
laguDAbharo
Wood bundle
cegulo
Chopped Firewood
jAL
Fire
huLa
Fire
vistev
Burning Coke
vinGgaL
Ember
pETlAv
Ignite
phuNaLi
Blower
dhUm
Smoke
ghompulo
Warm
khET
Boiling
haNDi
Frying Pan
dhiDA haNDi
Griddle
hurpi
Spatula
dhiDA hAt
Spatula
khurpi
Iron Spatula
phalAru haNDo
Idli Cooker
munkhrA peTi
Spice box
etnam
Utensil, Vessel
haNDO
Cooking Utensil
gaiDi
Small Pot
bhonna
Big Pot
koDum
Water storing pot
peysuthovli
Starch water vessel
kasaathaLo
Tin vessel
kegar
Rim of Utensil
havkO
Ladle
pinkaNi
Kitchen Utensil
poLi
Spoon
paLaer
Baby feeding spoon
bOni
Tumbler
tElu gagiDi
Small oil pot
Ugu
Plate
jhainA teTTo
Lid
puTTalu teTTo
Colander
jellaeT
Sieve
tambE
Water Pitcher
piDupOni
Kitchenware
bUT
Bottom
bhunto
Burnt food, Burnt pan
viLi
Traditional vegetable cutter
ghoDA polko
Small Bench
nivno
Coir Rope Trivet
puDki
Palm leaf Basket
dhumTA hokaLu
Wooden mortar
hokaL
Grinder
orgulO
Pounder
musaL
Pestle
cAt
Culinary Rod
cAku
Knife
dAN
Handle
iTki
Kitchen Tong
paTo
Base Stone
deguDA paTo
Spice grinding stone
paTA deyDo
Grinding Stone
solo
Measuring Cup
aDDO
Full Measure
suDo
Winnowing basket
sulO
Round shaped Winnowing basket to cool off hot rice
mottu
Churner
ciis ambaT
Tamarind Mix
ciisu poLTO
Squeezed Tamarind
hubbi
Overflow
nalli
Tap
jhaNNI
Broom
pUlu jhaNNi
Grass Broom
naLaeru jhaNNi
Coconut Palm Broom
keccenti
Gunny bag
muri boTTO
Kitchen Towel


Grocery
chislo
Grocery
tastun
Goods
paNAyi
Market
dOvu
Big market, Shop
sAL
Paddy
tandu
Rice
kastandu
Raw Rice
huTotandu
Boiled Rice
ghOma tandu
Wheat
phOmu
Semolina
jhoLLO
Millet
rhaki
Finger millet
koNDo
Bran
unGka
Husk
perAl
Puffed rice
aTkul
Flattened Rice
jirO
Cumin
mhoDojirO
Fennel
mhuri
Mustard
miri
Pepper
halat
Turmeric
kennu
Lentil, Legume
belO
Dal
thOru beLo
Red Gram
uDidu beLo
Black Gram
kaccennA beLO
Bengal Gram
cennO
Fried Gram
covLO
Cowpea
niLamu beLo
Green Gram
ssilam
Moong gram
deLi
Gram flour bread
deLe piiT
Gram flour
ghano
Wooden Oil Expeller
tEl
Oil
cOTtEl
Gingerly Oil
kaTalatEl
Groundnut Oil
naraeLu tUp
Coconut oil
andem
Castor Oil
pEN
Oil cake
miiT
Salt
ciis
Tamarind
sekkar
Sugar
suro
White candy sugar
guLLu
Jaggery, Coconut palm sugar
accuguLLu
Boxed Jaggery
tATiguLLu
Palm Jaggery
hinGgu
Asafoetida
simbu
Cereals
baddu
Spices
phumpu
Anise
dhAyi
Coriander seed
mitti
Fenugreek
tiik
Red chilli
tiiL
Black sesame
phiiL
White sesame seed
kuLit
Horse gram
sigAi
Shikakai Acacia
serki
Cotton seed
gulugunjji
Rosary Pea
soNTi
Dried Ginger
jeshTimatu
Licorice
rAsnu
Lesser Galangal
dumbrASTu
Greater Galangal
hekaN
Calamus, Sweet flag
akrAr
Akarkara Root


Vegetables
agastir
Lady's finger
ampaT bhajji
Sorrel Leaves, Sour Spinach
ambulo
Gooseberry
ambuno
Star gooseberry
allo
Ginger
avsAE bhajji
Hummingbird Tree Leaves
asturu
Lady's finger
uskailo
Turkey Berry
omApAn
Ajwain Leaf
onno
Broad beans
gavuru
Carrot
kaccikeLo
Green plantain
kaccekennu
Field Bean
kaccemirkkailo
Green Chilli
kando
Shallot
karku
Coconut shell
kallo
Bitter gourd
kavni bhajji
Black Nightshade
ggAjar
Carrot
kinsuphUl
Screw Pine
khumbAphUl
Leucas Aspera-Flower
guNDujigrA pAn
Coriander
lhovo kailo
Tomato
gulbuLLo
Sweet Potato
kerppAEv
Curry Leaf
keLanGgu
Tuber
kelAphUl
Ylang-ylang
keLupAn
Banana Leaf
kELuphUl
Banana Blossom
khovLo
Green Pumpkin
goggurkoLLA pAn
Oregano
komburaa bhajji
Amaranth Greens
kombuLo
Tender
koLunjji
Wild Lemon
cippo
Coconut Shell
caino
Meat
daraL bhajji
Malabar Spinach
duDA pAn
Jimson Weed
dhuLbuLLo
Potato
dhUmpAn
Tobacco
dheguLo
Amaranthus viridis
dheduDApAn
Datura leaf
dheyLA bhajji
Chinese Spinach
thoLci
Basil
doNTko
Ridge Gourd
doLLo
Yellow-fruit nightshade
tovDo
Peel
tonmo
Chilli Stalk
nagalpaan
Betal Leaf
naLaer
Coconut
nayappAn
Betal leaf
nerguDu pAn
Chaste Tree
bhajji
Greens, Spinach
panGgarA pAn
Indian Coral
paslAbhajji
Malabar Spinach
pAlak bhajji
Palak Spinach
buDunGkailo
Wild Melon
budno
Mint leaf
buLLo
Tuber
bhurkko bhajji
Tropical Amaranth
bheNDukailo
Lady's finger
beLAbhajji
Purslane
bonde
Plantain Stem
bhosuLo
Meat
poTgulo
Snake Gourd
poskAi
Pumpkin
bhosuLo
Bottlegourd
magApAn
False daisy
maskailo
Oak Galls
mhoDoviiT
Wild Lemon
mhoDO kandO
Onion
mitti bhajji
Fenugreek Leaves
mirkkailo
Chilli
mummuSTi pAn
Solanum
muLco
Radish
muLo
Raddish
munusto pAn
Mukia Maderaspatana
moLkA bhajji
Amaranthus viridis
moLko
Sprout
mOthuphUl
Screw Pine
raslo
Vegetables
lhovo mirkkailo
Red Chilli
limbu
Lemon
liimupAn
Neem Leaf
losan
Garlic
vanGgi
Egg Plant
vadunAbhajji
Mint
vaLko
Cucumber
viiT
Kaffir Lime
jinnavrE
Cluster Bean
suran
Yam
sekkaru buLLo
Sweet Potato
sekke
Bagasse
sevgA bhajji
Drumstick Leaf
sevgA jhAD
Drumstick tree
sEmpu
Colocasia
haraLi pAn
Scutch grass
huntirukAnu bhajji
Water Shamrock
hogatupAn
Herb


Trees


jhAT
Tree
jhaTki
Shrubs
vEl
Creeper
vittu
Seed
mUL
Root
ghiir
Deep
mUs
Bottom
tOs
Top
sipu
Tree Trunk
pindO
Tender
kaylO
Unripe
pikkeyo
Ripe
poLLO
Fruit
moLko
Bud
pAn
Leaf
sAkhu
Branch
jhADu poTTo
Bark
sailu
Shadow
damar
Lotus
rEk
Petal
bhOru poLLo
Jujube
jembu poLLo
Blackberry
limusu poLLo
Madras Thorn
limbu poLLO
Lemon
dhanim poLLo
Pomegranate
phonnisu poLLo
Jack fruit
ghirAsu poLLo
Pineapple
kovuTTu poLLo
Wood-apple
kaccambO
Mango
poLLAmbo
Ripe Mango
kaccambA biik
Mango seed
khOjaa
Watermelon
umbLo
Fig
imbLo
Guava
keLo
Banana, Ripe Plantain
happaL
Betel Nut
kobbu
Sugarcane
piskalu kobbu
Red Stained Sugarcane
tEku
Teak
liimu jhAD
Neem Tree
liimpAn
Neem leaf
pimpaL jhAD
Peepal Tree
oDA jhAD
Banyan Tree
ciisu jhAD
Tamarind Tree
cinciri
Tamarind Seed
candi jhAD
Silk Cotton tree
candi
Silk Cotton
kapus
Cotton
busko
Waste yarn
buso
Shell
naLaer jhAD
Cococnut Tree
nareLu jhaaDu
Coconut tree
kELujhAD
Banana Tree
sevkAE jhAD
Drumstick Tree
somijhAD
Jammi Tree
kAnu jhAD
Alexandrian Laurel Tree
biilujhaaD
Bael Tree
kElu tOmu
Banana Bunch
nareLu tOmu
Coconut flower
nareL
Coconut
rEsu
Scar
phEpu
Coconut bat, Petiole
phEvu
Coconut flower spathe
khuri
Coconut shell
Alu
Coconut husk
eLLiir
Tender Coconut
kaunal
Green tender coconut
saunal
Mature tender coconut
kaunal pani
Tender Coconut water
nareLu phEpu
Coconut husk
nareLbeLo
Coconut Fruit
nareLu kOru
Coconut seedling
komblo
Tender
junGkae jhAD
Aged tree
naraeLu ghOlu
Bunch of coconuts
mOku
Coconut sapling
dhEku
Coconut seedling
dhAru
Coconut bud
toDaestAnyo
Since plucked
kANDu
Rachis, Stem of a leaf
paruDo
Coconut fronds
paruNDo
Woven coconut leaves
chEvu
Woven coconut leaves
bUr
Palm leaf rope
juNan nikuLai
Starts bearing fruit
hiiDu jAnAtto
Without snag (dying)
gOn
Coir
tEmu
Coconut sap
sekkae
Waste fibre
phippi
Dust particles
tATi jhAT
Palm Tree
tATi keLanGku
Palmyra tuber
tALu jhAD
Palmyra tree
khaslA jhADu
Date palm tree
tALu bhiiju
Palmyra seed
kacca
Green or Unripe
tunjju
Palmyra tree
tunka
Tender Palmyra fruit
tumphal
Palmyra fruit
tALu pAn
Palm leaf
dallanGgu
Male palm fruit
sRii tALu jhAD
Male palmyra tree
hintALu jhAD
Talipot palm
huppaLu
Arecanut tree
khasuLu
Date palm tree
kailo lainA
Will not yield fruit
khasulA poLLo
Date fruit
bhuslA jhAD
Black or Mountain date palm
bhiisu
Black dates
ghiis
Dates
hAku
Grove, Garden
vruddi
Growing up
aLo
Garden plot
bhoNam
Part
khaTo
Thorn
cigur
Bud
govat
Hay
ghAs
Dried grass
haraLi
Green grass
poLko
Wood


Food
bhUk
Hungar
bhukko
Being hungry
agAr
Food
pani
Water
naLApani
Tap Water
bhAt
Rice
hadan
Boiling water to cook rice
avNTi
Tamarind Gravy
timTi
Indian Soup
koLkar
Chilli Gravy
dheynjJ
Curd
tAku
Buttermilk
kheras
Cottage cheese
loni
Butter
tUp
Oil, Clarified butter
dheynjJ avNTi
Curd Stew
bhajji
Greens
bhajji cAr
Green Stew
kaylokesur
Vegetables
kuTkiri
Curry
poLTini
Fries
taeLni
Oil Fry
sijvette
Boiling
phoNNi
Garnish
raito
Salad
dheynj kando
Onion Salad
oDi
Dried Crispy Rice
phOT
Vegetables
koDDi
Dried Fish
sukkaT
Dried mutton
cainO
Mutton
meyam
Fat
aNDo
Egg
lubbiN
Gooseberry Pickle
loSTo
Mint Chutney
bhuDit
Mash
ghaDini
Mash
vanGgi bhuDit
Mashed Eggplant
cakulatte
Side dish
gesi
Pickle
piiT
Batter
dhiDO
Rice Pancake
phalAr
Rice Cake
thovli phalaar
Clay pot rice cake
bhurko
Powder
bhairi
Deep Fried Bread
kenni pEs
Rice Porridge
muddA ponGgal
Rice cooked with lentils
ambaT bhAt
Tamarind Rice
limbu ponGgal
Lemon Rice
dheynjJ bhAt
Curd Rice
koDDo
Concentrated
paLTo
Diluted
tADo
Watery
gheTTi
Thick
dUt
Milk
neggun
Snacks
vaDO
Donut
AmbaDO
Spicy lentil Donut
miiDu vaDO
another spicy Donut
suguNDo
Sweet deep fried Dumpling
caili
Crunchy Snack
kandulo
sweet Dumplings
sevi
Sweet rice Dumplings
pasaem
Rice Pudding
halvO
Halva
puri
Indian sweet
keSAEv
Potion
pEs
Rice Porridge
dhuvan
Rice rinsed water
murgeyo
Rotten
viTTayayo
Stale
najjeyo
Spoilt
ressu
Juice
kuTkO
Small Piece


Time
atto
Now
khobbo
When
hodes
Was
sE
Is
rhaay
Will be
gheNTo
Time
gheDiyaLo
Clock
haatu gheDiyaLo
Watch
gheTi
Time
ssuba
Auspicious
vEL
Time
irkaDu vEL
Hard Times
phaar
Time
phaaru
A period of 3 Hours
soLophaar
Morning
phaltivaar
Morning
dhuvaar
Afternoon
dislo
Day time
visandulo
Dusk
viiLTO
Evening
raat
Night
nislo
Night time
seNam
Soon
ssunaas
Early
kalam
Period
kaalu
Period
kaalu
Ages
kaaL
Period
dassaa
Period
rrutu
Season
hoonukalam
Summer
povsukalam
Monsoon
himusukalam
Pre Winter / Cool Season
monjcukalam
Winter
varaLo
Spring
hunaLo
Summer
posaLo
Monsoon
poslo
Monsoon
ssiraLo
Autumn
himaLo
Pre Winter / Cool Season
iraLo
Winter
hoon
Sunny
mEgh
Cloud
ciNuk
Drizzle
cinkul
Drizzling
varo
Air, Wind
vaayu
Gas
povs
Rain
jhanjju
Torrential Rain
sadi
Umbrella
hiim
Cool
himus
Cold
osu
Snow
Osu
Mist
monjcu
Mist
monjcu
Fog
niiDO
Shadow
gheDi poDatte
Freeze
pani gheDDo
Ice
gerjano
Thunder
piDu
Lightning
vijili
Electricity
handaar
Dark
hujaal
Light
niccu
Daily
viLukku
Whole day
cendaam
Moon
surit
Sun
leggunu
Ascendant
neTshatru
Star
amaas
New Moon
puNNim
Full Moon
paDvo
Next day after Full/New Moon
pavTo
Next day after Full/New Moon
ghiraal
Planet
ghiraaN
Eclipse
dinnu
Day
odi
One day
dinnuvaar dinnu
Auspicious day
vaar
Week
somaar
Monday
mongLaar
Tuesday
budhyavaar
Wednesday
bestaar
Thursday
ssukraar
Friday
ssenvyaar
Saturday
aitaar
Sunday
kaal
Yesterday
hindo
Today
sondo
Tomorrow
sondro
Tomorrow
poram
Day after tomorrow
teram
4th day from today
tetteram
5th day from today
tega tetteram
6th day from today
phuLLandi
Previous day
mullandi
Previous Day
dusurandi
Next day
phallantdi
Another day
desti
10th day
viyaardi
11th day
baardi
12th day
mhaDo
Month
masarav
First day of the month
orsu
Year
orsu masarav
New Year
gEvorsu
Last Year
hollovorsu
Next Year
vartamaanakaalu
Present Tense
caltakaalu
Present Tense
bhootakaalu
Past Tense
bhavishyakaalu
Future Tense


Land

bhooynj
Earth
hiipu
Ground
poolOk
World
khaaNDu
Continent
praantu
Region
ushNo
Tropical
ollo
Wet
sukke
Dry
diivu
Island
dEss
Country
sonduru sovaTu
Coastal area
gaam
City / Town
gamulogaam
Outstation
porkyaaT
Village
raaN
Forest
vaLu raaN
Desert
kaantaaru taaru
Desert ship
sundur
Sea
laaT
Wave
neddi
River
tiir
River Bank
keTTo
(River) Bank, Shoreline
sunduru keTTo
Beach
neddi keTTo
River Bank
khauri
Pond
taLo
Lake
taLaatiir
Lake Bank
tiratte
Swimming
cEku
Dirt
cEkpani
Dirty water
nEkpani
Clean water
pulni
Boat
pulno
Overhead Bridge
kasu
Springs
hiir
Well
ghiraahiiru
Deep Well
hiirunako
Well Ring
khaNDi
Pit
oTccani
Drain
lOt
Deep
dongar
Hill
dongar
Mountain
ghOru
Steep
ssingu
Cliff
dongaru ssingu
Cliff or Summit of a hill
ghoovo
Cave
paarO
Rock
guNDo
Pebble
deguDO
Rock, Stone
deyDo
Stone
baLingudeyDo
Marble
ciDaayteyDo
Blue Metal
vaLu
Sand
matti
Soil
ramatti
Red Sand
ciDamatti
Clay
vaLumatti
Alluvial soil
dudoor
Long
deyDo (door)
Mile
peyno
Journey
langi jaatte
To cross
pijatte
Traveling
vaaT saarvo
Long journey
baanjji
Algae, Fungus
peyir
Crop
nausu
Grass
khEtu
Field
mastu
Manure
junnatte (peyir)
Ploughing
hallo
Plough
panku
Mud

People
menik
Man, Human
naro
Male
menkyaan
People
oNTiyaaL
Single Person
aiyyO
Purohit, Priest
peLadul
Ascetic, Saint
rushi
Sage
rinaitu
Debtor
thaNaitu
Police
oydu
Doctor
nangunaaru
Farmer
sonaaru
Smith
kesaar
Gold Smith
khadi
Black Smith
vinkar
Weaver
hoDait
Carpenter
lhekhkayt
Clerk
lindunaaru
Accountant
geDe nasatteno
Folk dancer
buDubuDaan
Soothsayer / Pellet drummer
heDDE
Stupid
keaavreaa
Hooligan, Rowdy
gheTikettaan
Smart Person
Tanknaaru
Stonemason
kotto
Mason
lauri
Mason
khumbaar
Potter
gollar
Dairyman
aLi
Woman
sinnaLi
Prostitute
vane
Vanniar
saNaar
Nadar
bhavan
Male Brahmin
bhavanin
Female Brahmin
poraT
Laundry Man
poLTin
Laundry Woman
vaiDE
Male Barber
vaiDin
Female Barber
movro
Male Knight
movrin
Female Knight
oDDE
Male Scavenger
oDDin
Female Scavenger
tuDe
Muslim
tuDE
Male Muslim
tuDin
Female Muslim
ayDE
Male who speaks Tamil
ayDin
Female who speaks Tamil
kholaabaatkero
Male Wanderer
kholaabaatkerin
Female Wanderer
singayt
Boy Friend
singati
Girl Friend
mukuLo
Dumb
cevuT
Male Deaf
cevDin
Female Deaf
guTDe
Male Blind
guTDi
Female Blind
oDDi
Blind
andu
Blind
moNDi
Handicap
noNDi
Lame
lovlE
Lean Man
lovlin
Lean Lady
bhotto
Fat Man
bhotti
Fat Lady
coDDO
Male Thief
coDDi
Female Thief
piso
Male Lunatic, Idiot
pisi
Female Lunatic, Idiot
bhodiri
Dancer
durbaL
Poor
dhanavantu
Rich Person
theLri dheretteno
Destitute person
bhaagyavantu
Blessed person
lObhi
Miser
paNait
Dealer, Trader
pulindun
Merchants
handaitu
Cook
lindaitun
Merchants
ejamaan
Owner
moogO
Crowd
gumpu
Mob
jedo
Group
annatturO
Who speak other language
dongargaamkeri
One who speaks Malayalam
telungo
One who speaks Telugu
phorunki
A foreigner, especially a British or a white person
kiraatu
Hunter
emuD
Yama

Numbers
sankyo
Number
ankan
Number
hadde
Halve
oNTo
One
dii
Two
thiinu
Three
caaru
Four
paancu
Five
sO
Six
saatu
Seven
aaTu
Eight
novu
Nine
dessu
Ten
vigiyaaru
Eleven
baaru
Twelve
tEru
Thirteen
covdu
Fourteen
phandaru
Fifteen
sovaLu
Sixteen
settaru
Seventeen
aTaaru oraaDu
Eighteen
okkanna viisu okaNiisu
Ninteen
viisu
Twenty
viisun oNTo
Twenty one
viisun dii
Twenty two
viisun thiinu
Twenty three
viisun caaru
Twenty four
poncisu
Twenty five
viisun sO
Twenty six
viisun saatu
Twenty seven
viisun aaTu
Twenty eight
okkanna tiisu
Twenty nine
tiisu
Thirty
caLisu
Forty
ponnaasu
Fifty
saaTu
Sixty
sattaru - ssiiru
Seventy
assi
Eighty
navatu
Ninety
sOvu
Hundred
sasaru
Thousand
lekku
Lakh
kOTi
Crore
kaal
Quarter
haddu
Half
pauno
Three fourth
dET
One and Half
dinnukaal
Two and Quarter
dinnaddu
Two and Half
kanno thiin
Two and 3 Quarters
mukkaal sO
Seventy Five
dET sO
Hundred and Fifty
dinnaddu sO
Two Hundred and Fifty

Ordinals
oNTvo - phailaa
First
thivo - dusro
Second
thinvo - thino
Third
carvo - caro
Fourth
pancvo - panco
Fifth
savo
Sixth
satvo
Seventh
aTvo - aTo
Eighth
nokvo - noko
Ninth
desvo - teso
Tenth
vigyarvo - vigyaro
Eleventh
barvo - baro
Twelfth
tervo - tero
Thirteenth
covduvo - covdo
Fourteenth
phandarvo - panduro
Fifteenth
sovaLvo - soLo
Sixteenth
settarvo - setvo
Seventeenth
oraDvo - oDro
Eighteenth
okaNisvo - oNisvo
Nineteenth
visvo - viso
Twentieth
tisvo - tiso
Thirtieth
caLisvo
Fortieth
ponnasvo
Fiftieth
saTvo - saTo
Sixtieth
sattatvo - ssirvo
Seventieth
asvo
Eightieth
natvo
Ninetieth
sokvo
Hundredth
sasarvo
Thousandth
lekvo
Hundred Thousandth
koTvo
Ten Millionth
oNTvanthi
First day
divandi
Second day
thinvandi
Third day
carandi
Forth day
panvandi
Fifth day
savandi
Sixth day
satvandi
Seventh day
aTvandi
Eigth day
nokvandi
Ninth day
desvandi
Tenth day
vigyaravandi
Eleventh day
barvandi
Twelfth day
tervandi
Thirteenth day
codvandi
Fourteenth day
phandrandi
Fifteenth day
sovaLvandi
Sixteenth day
setvandi
Seventeenth day
oraDvandi
Eighteenth day
okaNisvandi
Nineteenth day
visvandi
Twentieth day
tisvandi
Thirtieth day
caLisvandi
Fortieth day
ponnasvandi
Fiftieth day
saTvandi
Sixtieth day
ssirvandi
Seventieth day
asvandi
Eightieth day
navatvandi
Ninetieth day
sokvandi
Hundredth day
sasarandi
Thousandth day
lekvandi
Hundred Thousandth day
koTvandi
Ten Millionth day

Fraction
tivo
3/4
hadtu
1/2
covto
1/4
nino
3/16
aTno
1/8
kaLo
1/16
ugo
3/64
ssili
1/32
unjjo
1/64
tivaruNi
15/16
tivaraTo
7/8
tivarukaLo
13/16
tivarugo
51/64
tivaruLi
25/32
tivarujo
49/64
hadduruNi
11/16
hadduraTo
5/8
haddurukaLo
9/16
haddurugo
35/64
haddurussili
17/32
haddurujo
33/64
cauni
7/16
caaTo
3/8
caalo
5/16
caago
19/64
caassli
9/32
caajo
17/64
nigo
15/64
ago
11/64
kago
7/64
tingo
63/64
haDgo
43/64
halgo
39/64
hango
47/64
nili
7/32
ali
5/32
kali
3/32
tinssli
31/32
haTssli
21/32
halssli
19/32
hanssli
23/32
nijo
13/64
ajo
9/64
kajo
5/64
tinjo
49/64
haDjo
41/64
haljo
37/64
hanjjo
45/64

Weaving
mago
Loom
vinatte
Weaving
taat
Warp - (consists nine 6 yard sarees)
ponni kerattE
Warping
toor
Cloth Beam
davni
Woven Saree of 6 yards
neLi
Loom Wood Shuttle
keLi
Shuttle Roller
rittikeNDo
Loom Wood Bobbin
mago
Batten Handle
magaa miTTO
Weaver's seat
taak
Yarn
potti
A cone shaped hand tool to wind yarn for Handloom
podarO
A wooden tool from where the yarn is fed to the Bobbin
rheDo
Hand Spinning Wheel
panjculo
Treadles of Loom
tanO tavattE
Pedalling the Treadles
neTTatte
Shedding weft with warp
pholO
Ratchet Wheel
phonni
Reed or Metallic Comb

Material
mOl tavanaattayo
Precious
sorNu
Gold
appuranjji
Gold
hiran
Gold
hiro
Diamond
rettan
Gem Stone
ruppO
Silver
kestul
Bronze, Lead
liit
Brass
kaso
Bronze
tau
Tin
tamburam
Copper
lhokaNu
Iron
jelmin
Aluminium
kaLjam
Paper
bongu
Bamboo
vaLTi
Bamboo Poles
bongupoTTo
Bamboo Stick
bettem laiDo
Baton, Wood log

Animals
mrugo
Animal
jantu
Creature
ssishTajantu
Polite animal
dushTajantu
Wicked animal
gaamu moogu
Domestic animal
raaNu moogu
Wild animal
saadhu moogu
Peaceful animal
uTuttO
Squirrel
ciglo
Squirrel
hundir
Rat
ghoos
Bandicoot
cunjcu
Shrew
manjjiri
Cat
buskul
Male cat
sunO
Dog
bheNDu
Sheep
mheDi bheNDu
Sheep
sseli bheNDu
Goat
gaay
Cow
goru
Bull
bheys
Buffalo
raaN bheys
Wild Buffalo
dallaa goru
Uncastrated Bull
hallo goru
Bull for ploughing
duDo
Calf
ghedaT
Donkey
ghoDo
Horse
nakul
Mongoose
kundelu pillo
Rabbit
dukkar
Pig
kiiso
Monkey
kOtO
Male Monkey
kOti
Female Monkey
ENu
Deer
kholo
Fox
uko
Wolf
aistu
Elephant
simho
Lion
vaag
Tiger
bhaalu
Bear
bhallo
Bear
ugli
Sloths
lOlpaDe
Camel
muyi
Camel
tONDo
Garden Lizard
samsali
Skink
paalO
Lizard
mhaLi
Fish
kirvil
Crab
beskali
Frog
bharkaLi
Frog
bhELi
Toad
kishLo
Snail
tambalcippO
Tortoise
nakru
Crocodile
saap
Snake
dongar saap
Boa
pikuDo
Fish Gill
poos
Tail
pussiDi
Tail
soNTi
Trunk
dantu
Tusk
gaayigOshTu
Cow barn, Cow shed
loddi
Elephant Dung
loDi
Goat-droppings
sEn
Cow Dung
khuri
Hoof
phangiLa khOru
Closed hoof
vajradiDDu
Glue
keDsan
Leather
gorukommu
Horn
gorusinDo
Bull horn
damo
Snout rope
bheysudamo
Snout rope
coro
Prey, Feed
lumatte
Cud Chewing
hEru
Saddle
pausul
Bridle
kagDo
Hump
uuDo
Udder
gonduru
Cow Urine
gorajjana
Calculus bovis
piculo
Trap


Birds
pakshi
Bird
kauLo
Crow
kuDi
Hen
kuDO
Cock
kuDipillo
Chicken
ciDi
Sparrow
gauramO
Parrot
kokkurkaylo
Dove
kokil
Quill
mhOr
Peacock
ulu
Owl
ogul
Bat
aaDi
Duck
bako
Crane
kukro
Stork, Pelican
hamso
Swan
luvi
Quail
gauri
Chukar Partridge
bhaaraji
Skylark
dishLo
Eagle
ghaaru
Hawk
ssini
Falcon
bhiri
Condor
vankuDo
Eurasian teal
mushLi
Sandpiper
cungul
Claw
panjjiri
Nest
pinku
Wing
piiku
Feather
hili
Crest of a bird
pinjchE
Peacock's Tail

Insects
kiDo
Worm
haabu
Insect
habbu
Insect
mingi
Ant
kalomingi
Tiny Black Ant
lhovo mingi
Fire Ant
caaTo
Black Garden Ant
mhagi
House Fly
pisulO
Mosquito
bandO
Cockroach
jhuruL
Cricket
ghendal
Beetle
mauDi
Cellar Spider
dheynO
Bug
jhool
Leech
kankiDo
Caterpillar
jijjil
Glowworm
phoolupatango
Butterfly
gOmpe
Centipede
vinjcu
Scorpion
jhum
Lice, Louse
liik
Nits (Lice egg)
hudi
Silverfish, Moth
phoolumadhu
Necter
mai
Honey
mai mhakhi
Honey Bee
`;

// Parse the dictionary into a searchable format
// Creates both Sourashtra->English and English->Sourashtra lookups
// Handles edge cases: capitalization, duplicates, multi-word entries
function parseDictionary(rawDict) {
  const sourashtraToEnglish = new Map();
  const englishToSourashtra = new Map();
  const sentences = [];
  
  const lines = rawDict.split('\n');
  let currentCategory = '';
  let i = 0;
  
  // Helper to add entry with deduplication (keeps all translations)
  const addEntry = (sourashtra, english, category) => {
    const sKey = sourashtra.toLowerCase().trim();
    const eKey = english.toLowerCase().trim();
    
    // Skip empty entries
    if (!sKey || !eKey) return;
    
    // Add to Sourashtra -> English (store multiple meanings)
    if (sourashtraToEnglish.has(sKey)) {
      const existing = sourashtraToEnglish.get(sKey);
      // Add alternative meaning if different
      if (!existing.english.toLowerCase().includes(eKey) && 
          !eKey.includes(existing.english.toLowerCase())) {
        existing.alternatives = existing.alternatives || [];
        existing.alternatives.push(english);
      }
    } else {
      sourashtraToEnglish.set(sKey, { 
        english: english, 
        sourashtra: sourashtra, // Keep original casing
        category: category 
      });
    }
    
    // Add to English -> Sourashtra (store multiple translations)
    if (englishToSourashtra.has(eKey)) {
      const existing = englishToSourashtra.get(eKey);
      // Add alternative if different
      if (!existing.sourashtra.toLowerCase().includes(sKey) && 
          !sKey.includes(existing.sourashtra.toLowerCase())) {
        existing.alternatives = existing.alternatives || [];
        existing.alternatives.push(sourashtra);
      }
    } else {
      englishToSourashtra.set(eKey, { 
        sourashtra: sourashtra, 
        english: english, // Keep original casing
        category: category 
      });
    }
  };
  
  while (i < lines.length) {
    const line = lines[i]?.trim();
    
    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }
    
    // Detect category headers (e.g., "Body Parts - Sourashtra to English")
    if (line.includes(' - ') && (
        line.toLowerCase().includes('sourashtra') || 
        line.toLowerCase().includes('english') ||
        line.toLowerCase().includes('sentence'))) {
      currentCategory = line.split(' - ')[0].trim();
      i++;
      continue;
    }
    
    // Skip main headers
    if (line.startsWith('SOURASHTRA DICTIONARY') || line === 'EXAMPLES') {
      i++;
      continue;
    }
    
    // Check if next line exists and is likely a translation
    const nextLine = lines[i + 1]?.trim();
    if (nextLine && !nextLine.includes(' - ') && 
        !nextLine.startsWith('SOURASHTRA') && nextLine !== 'EXAMPLES') {
      
      // Determine if this is a sentence or a word pair
      const lineWords = line.split(/\s+/).length;
      const nextLineWords = nextLine.split(/\s+/).length;
      
      // Sentence detection: either side has 3+ words, or contains common sentence patterns
      const isSentence = lineWords >= 3 || nextLineWords >= 4 ||
        line.includes('?') || line.includes('!') || line.includes('.') ||
        nextLine.includes('?') || nextLine.includes('!') || 
        (nextLine.includes('.') && nextLineWords > 2);
      
      if (isSentence) {
        sentences.push({ 
          sourashtra: line, 
          english: nextLine, 
          category: currentCategory 
        });
      } else {
        // Word pair - add to both maps
        addEntry(line, nextLine, currentCategory);
      }
      i += 2;
    } else {
      i++;
    }
  }
  
  return { sourashtraToEnglish, englishToSourashtra, sentences };
}

// Parse dictionary once at module load
const PARSED_DICTIONARY = parseDictionary(SOURASHTRA_DICTIONARY_RAW);

// Verify dictionary is working correctly (development debugging)


// Add essential common phrases that might be missing or hard to find
const COMMON_PHRASES = [
  { sourashtra: 'namaskar', english: 'hello', category: 'Greetings' },
  { sourashtra: 'praNaman', english: 'namaste', category: 'Greetings' },
  { sourashtra: 'tumi kaise rhaas?', english: 'how are you?', category: 'Greetings' },
  { sourashtra: 'mi hollo rhaas', english: 'I am fine', category: 'Greetings' },
  { sourashtra: 'dhanyavaad', english: 'thank you', category: 'Greetings' },
  { sourashtra: 'maaf kero', english: 'sorry', category: 'Greetings' },
  { sourashtra: 'haa', english: 'yes', category: 'Common' },
  { sourashtra: 'nhai', english: 'no', category: 'Common' },
  { sourashtra: 'hollo', english: 'good', category: 'Common' },
  { sourashtra: 'kharab', english: 'bad', category: 'Common' },
  { sourashtra: 'torE naav kai?', english: 'what is your name?', category: 'Questions' },
  { sourashtra: 'morE naav...', english: 'my name is...', category: 'Introductions' },
  { sourashtra: 'mi samjhyo nhai', english: 'I don\'t understand', category: 'Common' },
  { sourashtra: 'pheri kaho', english: 'say again', category: 'Common' },
];

// Add common phrases to the parsed dictionary
COMMON_PHRASES.forEach(phrase => {
  const sKey = phrase.sourashtra.toLowerCase();
  const eKey = phrase.english.toLowerCase();
  
  if (!PARSED_DICTIONARY.sourashtraToEnglish.has(sKey)) {
    PARSED_DICTIONARY.sourashtraToEnglish.set(sKey, {
      english: phrase.english,
      sourashtra: phrase.sourashtra,
      category: phrase.category
    });
  }
  if (!PARSED_DICTIONARY.englishToSourashtra.has(eKey)) {
    PARSED_DICTIONARY.englishToSourashtra.set(eKey, {
      sourashtra: phrase.sourashtra,
      english: phrase.english,
      category: phrase.category
    });
  }
});



// Common synonyms to improve search (maps informal terms to dictionary terms)
const WORD_SYNONYMS = {
  // Family
  'dad': ['father', 'papa', 'daddy', 'pa'],
  'mom': ['mother', 'mama', 'mommy', 'mum', 'ma'],
  'grandma': ['grandmother', 'granny', 'grandmom'],
  'grandpa': ['grandfather', 'grandad', 'granddad'],
  'bro': ['brother'],
  'sis': ['sister'],
  'hubby': ['husband'],
  'wifey': ['wife'],
  'uncle': ['uncle', 'mama'],
  'auntie': ['aunt'],
  'aunt': ['aunt'],
  
  // Greetings
  'hi': ['hello', 'greetings', 'namaskar'],
  'hey': ['hello', 'greetings'],
  'bye': ['goodbye', 'farewell'],
  'thanks': ['thank you', 'gratitude'],
  'thx': ['thank you'],
  
  // Common words
  'ok': ['okay', 'yes'],
  'yeah': ['yes'],
  'yep': ['yes'],
  'nope': ['no'],
  'nah': ['no'],
  'kid': ['child', 'children', 'boy', 'girl'],
  'kids': ['children', 'child'],
  
  // Body parts
  'tummy': ['stomach', 'belly'],
  'belly': ['stomach'],
  'butt': ['buttocks', 'hip'],
  
  // Animals
  'kitty': ['cat'],
  'doggy': ['dog'],
  'puppy': ['dog'],
  'birdie': ['bird'],
  
  // Food
  'veggies': ['vegetables'],
  'veggie': ['vegetable'],
  
  // Time/Days
  'mon': ['monday'],
  'tue': ['tuesday'],
  'wed': ['wednesday'],
  'thu': ['thursday'],
  'fri': ['friday'],
  'sat': ['saturday'],
  'sun': ['sunday'],
};

// Generate phonetic variants for fuzzy matching
// Handles common romanization variations in Sourashtra
function generatePhoneticVariants(word) {
  const variants = new Set([word]);
  
  // Aspirated <-> non-aspirated consonants
  const aspirationPairs = [
    ['bh', 'b'], ['ph', 'p'], ['th', 't'], ['dh', 'd'],
    ['kh', 'k'], ['gh', 'g'], ['ch', 'c'], ['jh', 'j']
  ];
  
  for (const [aspirated, plain] of aspirationPairs) {
    // Add variant with aspiration removed
    if (word.includes(aspirated)) {
      variants.add(word.replace(new RegExp(aspirated, 'g'), plain));
    }
    // Add variant with aspiration added
    if (word.includes(plain) && !word.includes(aspirated)) {
      variants.add(word.replace(new RegExp(plain, 'g'), aspirated));
    }
  }
  
  // Common vowel variations
  const vowelPairs = [
    ['aa', 'a'], ['ee', 'i'], ['oo', 'u'], ['ai', 'e'], ['au', 'o']
  ];
  
  for (const [long, short] of vowelPairs) {
    if (word.includes(long)) {
      variants.add(word.replace(new RegExp(long, 'g'), short));
    }
  }
  
  return Array.from(variants);
}

// Search function for the dictionary
function searchDictionary(query, direction = 'auto') {
  const q = query.toLowerCase().trim();
  const exactResults = []; // Exact matches go first
  const fuzzyResults = []; // Phonetic/fuzzy matches
  const results = [];
  
  
  // Generate phonetic variants for the query
  const phoneticVariants = generatePhoneticVariants(q);
  
  // Expand query with synonyms
  const searchTerms = [q, ...phoneticVariants];
  if (WORD_SYNONYMS[q]) {
    searchTerms.push(...WORD_SYNONYMS[q]);
  }
  // Also check if query is a synonym value
  for (const [key, synonyms] of Object.entries(WORD_SYNONYMS)) {
    if (synonyms.includes(q)) {
      searchTerms.push(key);
    }
  }
  
  // For multi-word queries, also search for individual words
  const words = q.split(/\s+/);
  if (words.length > 1) {
    // Add the full phrase and individual words
    words.forEach(word => {
      if (word.length > 2) {
        searchTerms.push(word);
        searchTerms.push(...generatePhoneticVariants(word));
      }
    });
  }
  
  // Search Sourashtra -> English (try all search terms)
  if (direction === 'auto' || direction === 'sourashtra_to_english') {
    for (const term of searchTerms) {
      const exact = PARSED_DICTIONARY.sourashtraToEnglish.get(term);
      if (exact) {
        const isPhoneticMatch = term !== q && phoneticVariants.includes(term);
        exactResults.push({ 
          type: 'word', 
          sourashtra: exact.sourashtra || term, 
          english: exact.english, 
          alternatives: exact.alternatives,
          category: exact.category, 
          searchedFor: query,
          matchedTerm: term,
          matchType: isPhoneticMatch ? 'phonetic' : 'exact'
        });
      }
    }
    // Partial matches (only if no exact matches)
    if (exactResults.length === 0) {
      for (const [key, value] of PARSED_DICTIONARY.sourashtraToEnglish) {
        if (searchTerms.some(term => key.includes(term)) && !searchTerms.includes(key)) {
          results.push({ 
            type: 'word', 
            sourashtra: value.sourashtra || key, 
            english: value.english, 
            alternatives: value.alternatives,
            category: value.category,
            matchType: 'partial'
          });
          if (results.length >= 10) break;
        }
      }
    }
  }
  
  // Search English -> Sourashtra (try all search terms)
  if (direction === 'auto' || direction === 'english_to_sourashtra') {
    // First, try exact matches - PRIORITIZE THESE
    for (const term of searchTerms) {
      const exact = PARSED_DICTIONARY.englishToSourashtra.get(term);
      if (exact) {
        const isPhoneticMatch = term !== q && phoneticVariants.includes(term);
        exactResults.push({ 
          type: 'word', 
          english: exact.english || term, 
          sourashtra: exact.sourashtra, 
          alternatives: exact.alternatives,
          category: exact.category, 
          searchedFor: query,
          matchedTerm: term,
          matchType: isPhoneticMatch ? 'phonetic' : 'exact'
        });
      }
    }
    
    // Only do partial matches if no exact matches found
    if (exactResults.length === 0) {
      // Then, find entries where the key contains the full query (phrase match)
      if (q.length > 2) {
        for (const [key, value] of PARSED_DICTIONARY.englishToSourashtra) {
          if (key.includes(q) && !results.some(r => r.english?.toLowerCase() === key)) {
            results.push({ 
              type: 'word', 
              english: value.english || key, 
              sourashtra: value.sourashtra, 
              alternatives: value.alternatives,
              category: value.category,
              matchType: 'phrase'
            });
            if (results.length >= 5) break;
          }
        }
      }
      
      // Finally, partial word matches
      for (const [key, value] of PARSED_DICTIONARY.englishToSourashtra) {
        if (searchTerms.some(term => key.includes(term)) && !results.some(r => r.english?.toLowerCase() === key)) {
          results.push({ 
            type: 'word', 
            english: value.english || key, 
            sourashtra: value.sourashtra, 
            alternatives: value.alternatives,
            category: value.category,
            matchType: 'partial'
          });
          if (results.length >= 10) break;
        }
      }
    }
  }
  
  // Only search sentences if no word matches found
  if (exactResults.length === 0 && results.length === 0) {
    for (const sentence of PARSED_DICTIONARY.sentences) {
      const matchesSourashtra = searchTerms.some(term => sentence.sourashtra.toLowerCase().includes(term));
      const matchesEnglish = searchTerms.some(term => sentence.english.toLowerCase().includes(term));
      if (matchesSourashtra || matchesEnglish) {
        results.push({ type: 'sentence', ...sentence });
        if (results.length >= 15) break;
      }
    }
  }
  
  // Combine exact matches first, then other results
  const allResults = [...exactResults, ...results];
  
  // Deduplicate results by sourashtra+english combination
  const seen = new Set();
  const uniqueResults = allResults.filter(r => {
    const key = `${r.sourashtra?.toLowerCase()}-${r.english?.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return uniqueResults.slice(0, 10); // Return max 10 results
}


// Function declarations for Live API tool calling
const DICTIONARY_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'lookup_sourashtra_word',
        description: 'Look up a Sourashtra word to find its English meaning, or look up an English word to find its Sourashtra translation. Use this whenever a user asks about a word, translation, or vocabulary.',
        parameters: {
          type: 'object',
          properties: {
            word: {
              type: 'string',
              description: 'The word to look up (can be in Sourashtra or English)'
            },
            direction: {
              type: 'string',
              enum: ['auto', 'sourashtra_to_english', 'english_to_sourashtra'],
              description: 'Search direction. Use "auto" to search both directions.'
            }
          },
          required: ['word']
        }
      },
      {
        name: 'get_category_words',
        description: 'Get a list of Sourashtra words from a specific category like body parts, animals, food, days of week, etc.',
        parameters: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'The category to get words from (e.g., "body parts", "animals", "food", "days")'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of words to return (default 10)'
            }
          },
          required: ['category']
        }
      }
    ]
  }
];

// Function to get words from a category
function getCategoryWords(category, limit = 10) {
  const categoryLower = category.toLowerCase();
  const results = [];
  
  for (const [sourashtra, data] of PARSED_DICTIONARY.sourashtraToEnglish) {
    if (data.category?.toLowerCase().includes(categoryLower)) {
      results.push({ sourashtra, english: data.english });
      if (results.length >= limit) break;
    }
  }
  
  return results;
}

// Handle function calls from the Live API
function handleFunctionCall(functionCall) {
  const { name, args } = functionCall;
  
  switch (name) {
    case 'lookup_sourashtra_word': {
      const word = args.word || args.query || ''; // Handle different arg names
      const results = searchDictionary(word, args.direction || 'auto');
      if (results.length === 0) {
        return { 
          found: false, 
          searchedFor: word,
          message: `No results found for "${word}". The word might not be in the dictionary yet. Try a different spelling.` 
        };
      }
      // Return a simplified format that's easier for the model to use
      const topResult = results[0];
      const isPhoneticMatch = topResult.matchType === 'phonetic';
      
      return { 
        found: true, 
        searchedFor: word,
        matchType: topResult.matchType,
        // If phonetic match, tell the model what we actually matched
        note: isPhoneticMatch ? `"${word}" matched phonetically to "${topResult.matchedTerm}" in the dictionary` : null,
        sourashtra: topResult.sourashtra,
        english: topResult.english,
        category: topResult.category,
        alternatives: topResult.alternatives,
        allResults: results.slice(0, 3) // Limit to top 3 results
      };
    }
    
    case 'get_category_words': {
      const results = getCategoryWords(args.category, args.limit || 10);
      if (results.length === 0) {
        return { found: false, message: `No words found in category "${args.category}". Available categories include: body parts, animals, food, days of week, colors, family relations.` };
      }
      return { found: true, category: args.category, words: results };
    }
    
    default:
      console.warn(`📚 Unknown function: ${name}`);
      return { error: `Unknown function: ${name}` };
  }
}

export function useLiveVoice() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const sessionRef = useRef(null);
  const audioContextRef = useRef(null);
  const playbackContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const sourceNodeRef = useRef(null);
  const isListeningRef = useRef(false); // Ref to track listening state in callbacks
  
  // Refs for accumulating transcription
  const currentUserTextRef = useRef('');
  const currentAITextRef = useRef('');
  const userTextTimeoutRef = useRef(null);
  const aiTextTimeoutRef = useRef(null);
  
  // Ref for session resumption handle (valid for 2 hours after session termination)
  const sessionResumeHandleRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Helper: Convert Float32Array to Int16 PCM
  const floatTo16BitPCM = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  // Helper: ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper: Base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Finalize user transcription
  const finalizeUserText = useCallback(() => {
    if (currentUserTextRef.current.trim()) {
      const text = currentUserTextRef.current.trim();
      setTranscript(prev => [...prev, { type: 'user', text, complete: true }]);
      currentUserTextRef.current = '';
    }
    if (userTextTimeoutRef.current) {
      clearTimeout(userTextTimeoutRef.current);
      userTextTimeoutRef.current = null;
    }
  }, []);

  // Finalize AI transcription
  const finalizeAIText = useCallback(() => {
    if (currentAITextRef.current.trim()) {
      const text = currentAITextRef.current.trim();
      setTranscript(prev => [...prev, { type: 'ai', text, complete: true }]);
      currentAITextRef.current = '';
    }
    if (aiTextTimeoutRef.current) {
      clearTimeout(aiTextTimeoutRef.current);
      aiTextTimeoutRef.current = null;
    }
  }, []);

  // Play audio from queue
  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setIsSpeaking(true);

    const audioData = audioQueueRef.current.shift();
    
    try {
      // Create playback context if needed (24kHz for Gemini output)
      if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
        playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: OUTPUT_SAMPLE_RATE
        });
      }

      if (playbackContextRef.current.state === 'suspended') {
        await playbackContextRef.current.resume();
      }

      // Decode PCM16 to Float32
      const pcm16 = new Int16Array(audioData);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      // Skip empty or near-silent chunks
      let maxAmp = 0;
      for (let i = 0; i < float32.length; i++) {
        const abs = Math.abs(float32[i]);
        if (abs > maxAmp) maxAmp = abs;
      }
      if (maxAmp < 0.001 || float32.length === 0) {
        isPlayingRef.current = false;
        if (audioQueueRef.current.length > 0) {
          playNextAudio();
        }
        // Don't set isSpeaking(false) here - more audio might be arriving
        return;
      }

      const audioBuffer = playbackContextRef.current.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
      audioBuffer.getChannelData(0).set(float32);

      const source = playbackContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      
      // Add gain node for volume control
      const gainNode = playbackContextRef.current.createGain();
      gainNode.gain.value = 0.85;
      
      source.connect(gainNode);
      gainNode.connect(playbackContextRef.current.destination);
      
      sourceNodeRef.current = source;
      
      source.onended = () => {
        isPlayingRef.current = false;
        sourceNodeRef.current = null;
        if (audioQueueRef.current.length > 0) {
          setTimeout(() => playNextAudio(), 5);
        } else {
          setIsSpeaking(false);
        }
      };
      
      source.start();
    } catch (err) {
      console.error('Audio playback error:', err);
      isPlayingRef.current = false;
      setIsSpeaking(false);
      if (audioQueueRef.current.length > 0) {
        playNextAudio();
      }
    }
  }, []);

  // Connect to Gemini Live API
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      
      const tokenResponse = await fetch(`${API_URL}/live/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const tokenText = await tokenResponse.text();

      let tokenData;
      try {
        tokenData = JSON.parse(tokenText);
      } catch (e) {
        throw new Error(`Invalid response from server: ${tokenText.substring(0, 100)}`);
      }

      if (!tokenResponse.ok || !tokenData.success) {
        throw new Error(tokenData.error || 'Failed to get API key');
      }

      const apiKey = tokenData.token;
      // Model name without 'models/' prefix - SDK adds it automatically
      const model = tokenData.model || 'gemini-2.5-flash-native-audio-preview-09-2025';


      // Dynamically import the Google GenAI SDK
      const { GoogleGenAI, Modality } = await import('@google/genai');
      
      const ai = new GoogleGenAI({ apiKey });

      // Get the system instruction - MUST be short for Live API
      // If backend sends a large instruction (>5000 chars), use the local short one
      let systemInstr;
      if (tokenData.systemInstruction && tokenData.systemInstruction.length < 5000) {
        systemInstr = tokenData.systemInstruction;
      } else {
        systemInstr = VOICE_SYSTEM_INSTRUCTION;
        if (tokenData.systemInstruction) {
          console.warn('Backend instruction too large:', tokenData.systemInstruction.length, 'chars - using local short version');
        }
      }

      // Build config object for Live API
      // Model supports up to 131,072 input tokens and 8,192 output tokens
      const liveConfig = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: 'Kore'
            }
          }
        },
        // System instruction must be a plain string (not wrapped in parts)
        // Keep it SHORT - large instructions cause "invalid argument" errors
        systemInstruction: systemInstr,
        // Enable transcription for both input and output
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        // Enable function calling for dictionary lookups
        // This allows the AI to search the dictionary without loading it all in context
        tools: DICTIONARY_TOOLS
      };


      // Connect to Live API with transcription enabled
      const session = await ai.live.connect({
        model: model,
        config: liveConfig,
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            setTranscript([{
              type: 'system',
              text: 'Click "Start" to begin speaking in Sourashtra or English.'
            }]);
          },
          onmessage: (message) => {
            // Debug: Log all message types to see what's coming through
            const msgKeys = Object.keys(message).filter(k => message[k] !== undefined && message[k] !== null);
            if (msgKeys.length > 0 && !msgKeys.includes('serverContent')) {
            }
            
            // Handle audio response
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data ||
                             message.serverContent?.modelTurn?.parts?.[0]?.audio ||
                             message.audio;

            if (audioData && typeof audioData === 'string') {
              try {
                const audioBuffer = base64ToArrayBuffer(audioData);
                audioQueueRef.current.push(audioBuffer);
                // Set speaking state immediately when audio arrives (not when playback starts)
                setIsSpeaking(true);
                setIsProcessing(false);
                playNextAudio();
              } catch (err) {
                console.error('Error processing audio:', err);
              }
            }

            // Handle input transcription (what user said)
            if (message.serverContent?.inputTranscription?.text) {
              const userText = message.serverContent.inputTranscription.text;
              currentUserTextRef.current += userText;
              
              // Reset timeout for accumulation
              if (userTextTimeoutRef.current) {
                clearTimeout(userTextTimeoutRef.current);
              }
              userTextTimeoutRef.current = setTimeout(finalizeUserText, 1500);
            }

            // Handle output transcription (what AI said)
            if (message.serverContent?.outputTranscription?.text) {
              const aiText = message.serverContent.outputTranscription.text;
              currentAITextRef.current += aiText;
              
              // Reset timeout for accumulation
              if (aiTextTimeoutRef.current) {
                clearTimeout(aiTextTimeoutRef.current);
              }
              aiTextTimeoutRef.current = setTimeout(finalizeAIText, 1500);
            }

            // Handle tool calls (function calling for dictionary lookups)
            if (message.toolCall) {
              const functionResponses = [];
              
              for (const fc of message.toolCall.functionCalls || []) {
                
                // Execute the function and get the result
                const result = handleFunctionCall({ name: fc.name, args: fc.args });
                
                functionResponses.push({
                  id: fc.id,
                  name: fc.name,
                  response: result
                });
              }
              
              // Send tool responses back to the session
              if (functionResponses.length > 0 && sessionRef.current) {
                sessionRef.current.sendToolResponse({ functionResponses });
              }
            }

            // Handle turn complete
            if (message.serverContent?.turnComplete) {
              // Finalize any pending transcriptions
              finalizeUserText();
              finalizeAIText();
              setIsProcessing(false);
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              if (sourceNodeRef.current) {
                try { sourceNodeRef.current.stop(); } catch (e) {}
              }
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              setIsSpeaking(false);
            }

            // Handle generation complete
            if (message.serverContent?.generationComplete) {
              // If queue is empty and not playing, turn off speaking state
              if (audioQueueRef.current.length === 0 && !isPlayingRef.current) {
                setIsSpeaking(false);
              }
            }

            // Handle session resumption updates
            // Store the handle for potential reconnection (valid for 2 hours)
            if (message.sessionResumptionUpdate) {
              const update = message.sessionResumptionUpdate;
              if (update.resumable && update.newHandle) {
                sessionResumeHandleRef.current = update.newHandle;
              }
            }

            // Handle GoAway message (server will disconnect soon)
            if (message.goAway) {
              console.warn('Gemini Live API: Server disconnecting soon. Time left:', message.goAway.timeLeft);
              setTranscript(prev => [...prev, {
                type: 'system',
                text: 'Connection will reset shortly. Your session will continue automatically.'
              }]);
            }

            // Handle usage metadata (token counts)
            if (message.usageMetadata) {

            }
          },
          onerror: (err) => {
            console.error('Gemini Live API error:', err);
            setError('Connection error. Please try reconnecting.');
            setIsConnecting(false);
          },
          onclose: (event) => {
            setIsConnected(false);
            setIsListening(false);
            isListeningRef.current = false;
            setIsConnecting(false);
            
            if (sourceNodeRef.current) {
              try { sourceNodeRef.current.stop(); } catch (e) {}
            }
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            setIsSpeaking(false);
          }
        }
      });

      sessionRef.current = session;

    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, playNextAudio, finalizeUserText, finalizeAIText]);

  // Start listening (capture microphone and send audio)
  const startListening = useCallback(async () => {
    if (!isConnected || !sessionRef.current) {
      setError('Please connect first.');
      return;
    }

    if (isListeningRef.current) return;

    try {
      // Get microphone access with optimized settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: SAMPLE_RATE // Request 16kHz directly if supported
        }
      });

      mediaStreamRef.current = stream;

      // Create audio context at 16kHz for minimal resampling
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: SAMPLE_RATE
      });
      audioContextRef.current = audioContext;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const source = audioContext.createMediaStreamSource(stream);
      
      // Calculate resampling ratio (should be close to 1 now)
      const inputSampleRate = audioContext.sampleRate;
      const resampleRatio = SAMPLE_RATE / inputSampleRate;

      // Try to use AudioWorklet (modern, low-latency)
      try {
        await audioContext.audioWorklet.addModule('/audio-processor.js');
        
        const workletNode = new AudioWorkletNode(audioContext, 'audio-capture-processor');
        processorRef.current = workletNode;
        
        // Handle audio data from worklet
        workletNode.port.onmessage = (event) => {
          if (event.data.type === 'audio' && sessionRef.current && isListeningRef.current) {
            const inputData = event.data.buffer;
            
            // Resample if needed
            let processedData;
            if (Math.abs(resampleRatio - 1) > 0.01) {
              const outputLength = Math.round(inputData.length * resampleRatio);
              processedData = new Float32Array(outputLength);
              for (let i = 0; i < outputLength; i++) {
                const srcIndex = i / resampleRatio;
                const srcIndexFloor = Math.floor(srcIndex);
                const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
                const t = srcIndex - srcIndexFloor;
                processedData[i] = inputData[srcIndexFloor] * (1 - t) + inputData[srcIndexCeil] * t;
              }
            } else {
              processedData = inputData;
            }
            
            const pcm16 = floatTo16BitPCM(processedData);
            const base64Audio = arrayBufferToBase64(pcm16.buffer);

            try {
              sessionRef.current.sendRealtimeInput({
                audio: {
                  data: base64Audio,
                  mimeType: "audio/pcm;rate=16000"
                }
              });
            } catch (err) {
              if (!err.message?.includes('CLOSING') && !err.message?.includes('CLOSED')) {
                console.error('Send audio error:', err);
              }
            }
          }
        };

        source.connect(workletNode);
        // AudioWorklet doesn't need to connect to destination
        
      } catch (workletError) {
        // Fallback to ScriptProcessor if AudioWorklet fails
        console.warn('AudioWorklet not available, falling back to ScriptProcessor:', workletError);
        
        const processor = audioContext.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;
        
        processor.onaudioprocess = (e) => {
          if (!sessionRef.current || !isListeningRef.current) return;

          const inputData = e.inputBuffer.getChannelData(0);
          
          // Noise gate
          let maxAmplitude = 0;
          for (let i = 0; i < inputData.length; i++) {
            const abs = Math.abs(inputData[i]);
            if (abs > maxAmplitude) maxAmplitude = abs;
          }
          if (maxAmplitude < 0.01) return;
          
          // Resample if needed
          let processedData;
          if (Math.abs(resampleRatio - 1) > 0.01) {
            const outputLength = Math.round(inputData.length * resampleRatio);
            processedData = new Float32Array(outputLength);
            for (let i = 0; i < outputLength; i++) {
              const srcIndex = i / resampleRatio;
              const srcIndexFloor = Math.floor(srcIndex);
              const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
              const t = srcIndex - srcIndexFloor;
              processedData[i] = inputData[srcIndexFloor] * (1 - t) + inputData[srcIndexCeil] * t;
            }
          } else {
            processedData = inputData;
          }
          
          const pcm16 = floatTo16BitPCM(processedData);
          const base64Audio = arrayBufferToBase64(pcm16.buffer);

          try {
            if (sessionRef.current) {
              sessionRef.current.sendRealtimeInput({
                audio: {
                  data: base64Audio,
                  mimeType: "audio/pcm;rate=16000"
                }
              });
            }
          } catch (err) {
            if (!err.message?.includes('CLOSING') && !err.message?.includes('CLOSED')) {
              console.error('Send audio error:', err);
            }
          }
        };

        source.connect(processor);
        const silentGain = audioContext.createGain();
        silentGain.gain.value = 0;
        processor.connect(silentGain);
        silentGain.connect(audioContext.destination);
      }

      setIsListening(true);
      isListeningRef.current = true;
      setError(null);

    } catch (err) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access.');
      } else {
        setError('Could not access microphone.');
      }
    }
  }, [isConnected]);

  // Stop listening
  const stopListening = useCallback(() => {
    setIsListening(false);
    isListeningRef.current = false;

    if (processorRef.current) {
      // Send stop command to AudioWorklet if it's a worklet node
      if (processorRef.current.port) {
        processorRef.current.port.postMessage({ command: 'stop' });
      }
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    stopListening();

    // Finalize any pending transcriptions
    finalizeUserText();
    finalizeAIText();

    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current = null;
    }

    audioQueueRef.current = [];
    isPlayingRef.current = false;

    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setTranscript([]);
    setError(null);
  }, [stopListening, finalizeUserText, finalizeAIText]);

  // Send text message
  const sendText = useCallback((text) => {
    if (!isConnected || !sessionRef.current || !text.trim()) return;

    setIsProcessing(true);
    setTranscript(prev => [...prev, { type: 'user', text: text.trim(), complete: true }]);

    try {
      sessionRef.current.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{ text: text.trim() }]
        }],
        turnComplete: true
      });
    } catch (err) {
      console.error('Send text error:', err);
      setError('Failed to send message.');
      setIsProcessing(false);
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (userTextTimeoutRef.current) clearTimeout(userTextTimeoutRef.current);
      if (aiTextTimeoutRef.current) clearTimeout(aiTextTimeoutRef.current);
      if (sessionRef.current) sessionRef.current.close();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
      if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') playbackContextRef.current.close();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendText,
  };
}