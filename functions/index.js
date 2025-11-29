import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Modality } from '@google/genai';
import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Define secrets (set via: firebase functions:secrets:set GEMINI_API_KEY)
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

// Create a router for /api routes
const router = express.Router();

// Available models
const MODELS = {
  chat: 'gemini-flash-latest',
  chatLite: 'gemini-flash-lite-latest',
  image: 'gemini-3-pro-image-preview',
  live: 'gemini-2.5-flash-native-audio-preview-09-2025'
};

// Sourashtra AI System Instruction
const SOURASHTRA_SYSTEM_INSTRUCTION = `SOURASHTRA DICTIONARY
EXAMPLES
1) “Mi” = I

Mi kon? = Who am I
Mi nha. = Not I am
Mi veenkaar. = I am a weaver

2) “Tu” = You (singular)

Tu gia? = Is it you
Tu kha. = You eat
Tu kaai kerorthe? = What are you doing

3) “a”

First letter of Sourashtra
Pronounced like “A” in AT
Continuous “a” → thinking, negative like “un / in”

SOURASHTRA DICTIONARY:

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

Script - Animals

ꢪꢹꢔꢸꢥ꣄
मूगुन्
ꢔꢿꢬꢸ ꢪꢹꢒꢸꢥ꣄
गेरु मूकुन
ꢔꢵꢫ꣄
गाय्
ꢩꢾꢠ꣄ꢞꢸ
भ॑ण्डु
ꢔꢵꢫ꣄ ꢔꣁꢬꢸꢥ꣄
गाय घा॑रुन्
ꢦꣁꢡꢸꢭꣁ
पा॑दुला॑
ꢩꢾꢫ꣄ꢱ꣄
भ॑य्स्
ꢩꢾꢫ꣄ꢱꢸ꣄ ꢦꣁꢡꢸꢭꣁ
भ॑य्सुबा॑दुला॑
ꢪꢸꢫꢶ. ꢭꣁꢭ꣄ꢦꢣꢾ
मुयि ला॑ल्पड॑
ꢦꣁꢡꢸꢭꣁ
बा॑दुला॑
ꢕꢾꢣꢞ꣄
घ॑दड
ꢣꢸꢞꣁ ꢮꢵꢱꢬ꣄
दुडा॑ वासर
ꢔꣁꢬꢸ
गा॑रु
ꢕꣁꢞꣁ
घा॑डा॑
ꢒꢷꢱ꣄ ꢦꣁꢭꢥ꣄ꢔꢸ ꢮꢥ꣄ꢕꢪꢶ
कीस् पा॑लङ्गु वन्धमि
ꢩꢾꢠ꣄ꢞꢸ ꢪꢴꢾꢞꢶꢩꢾꢠ꣄ꢞꢸ
भ॑ण्डु न्ह॑डिभ॑ण्डु
ꢕꢾꢣꢞꢕꣁꢞꣁ꣄
घ॑दड्घा॑डा॑
ꢱꢸꢥꣁ
सना॑
ꢦꣀꢭ꣄ ꢱꢸꢥꣁ
बैल्शुना॑
ꢣꢸꢒ꣄ꢒꢬ꣄
दुक्कर
ꢪꢛ꣄ꢙꢶꢬꢶ
मञजिरि
ꢔꣁꢬꢸ
गा॑रु
ꢲꢬꢶꢥ꣄
हरिन्
ꢪꢺꢔꣁ ꢪꢹꢔꢸ
मृगा॑ मूगु
ꢯꢯꣁ ꢓꢸꢥ꣄ꢣꢾꢭ꣄
शशा॑ खुन्द॑ल्
ꢦꢵꢭꢥ ꢪꢹꢔꢸ
पालन मूगु
ꢒꣁꢗ꣄ꢗꢶ ꢱꢸꢥꣁ ꢓꢿꢜꢸꢱꢸꢥꣁ
का॑च्चि सुना॑ खेटु सुना॑
ꢬꢵꢠꢸ ꢪꢹꢔꢸꢥ꣄ ꢮꢥꢪꢹꢔꢸꢥ꣄
राणु मूगुन वनमूगुन
ꢗꢶꢡ꣄ꢬꢪꢸꢫꢶ
चित्रमुयि
ꢆꢒꣁ ꢮꢺꢒꣁ꣄
उका॑ वृका॑
ꢔꢖ꣄ꢔꢵꢬꢸ
गङगारु
ꢗꢶꢡ꣄ꢬꢮꢵꢔ꣄
चित्रवाग्
ꢩꢭ꣄ꢭꢸ
भल्लु
ꢕꢾꢣꢞ꣄ꢮꢵꢔ꣄
घ॑दड्वाग्
ꢮꢥꢪꢛ꣄ꢙꢶꢬꢶ
वनमञजिरि
ꢮꢥꢪꢹꢔꢸ
वनमूगु
ꢬꢵꢠꢸ ꢩꢾꢫ꣄ꢱ꣄
राणु भ॑य्स्
ꢥꢥꢡꢸꢬ꣄꣄ ꢓꣁꢭꣁ
तन्तुर्का॑ला॑
ꢄꢱ꣄ꢪ꣄ꢪꣁ ꢱꢶꢪ꣄ꢲꢸ
सिम्मा॑ शिम्हु
ꢡꢬꢒ꣄ꢰꢹ
तरक्षु
ꢓꣁꢭꣁ
खा॑ला॑
ꢮꢵꢔ꣄
वाग्
ꢪꢾꢥꢶꢒꢸ ꢒꢷꢱ꣄
म॑निकु कीस्
ꢓꢞꢵ ꢣꢸꢒ꣄ꢒꢬ꣄
खडा दुक्कर
ꢲꣀꢱ꣄ꢡꢸ ꢎꢱ꣄ꢡꢸ
हैस्तु ऐस्तु
ꢔꢶꢡꢵ ꢕꣁꢞꣁ
गिता घा॑डा॑
ꢪꢹꢔꢸ ꢂꢖ꣄ꢔꢸꢥ꣄ ꢒꢶꢥꢸ ꢗꣁꢬꢵꢥ꣄
मूगु अङ्गुन् किनु चा॑रान्
ꢪꢵꢪ꣄ꢱꢸ ꢓꣁꢮ꣄ꢱ꣄ ꢨꣁꢱꢸꢭꣁ
माम्सु खा॑व्स बा॑सुला॑
ꢯꢾꢬꢶꢬ꣄ ꢃꢖ꣄ꢒꢸ ꢡꢥꢸ
श॑रिर आङगु तनु
ꢒꢪ꣄ꢨ꣄ꢭꣁ
कम्बला॑
ꢤꢸꢮꢥ꣄ ꢤꢸꢮꢥꢸ ꢦꢥꢶ
धुवन् धुवनु पनि
ꢓꢸꢬꢶ ꢓꣁꢬ꣄
खुरि खोर
ꢱꢶꢖ꣄ꢔꢸ
सिङगु
ꢯꢾꢠ꣄
शेण्
ꢱꣁꢠ꣄ꢜꢶ
सा॑ण्टि
ꢮꢶꢒ꣄ꢒꢸ ꢣꢵꢣ꣄
विक्कु दात्
ꢮꢶꢒ꣄ꢒꢸ
विक्कु
ꢮꢶꢒ꣄ꢒꢸꢣꢵꢡ꣄
विक्कुदात्
ꢱꢾꢬ꣄ꢒꢶ
स॑र्कि
ꢪꢵꢥ꣄ꢣꢸꢓꢿꢱ꣄
मान्दु खेस
ꢦꢾꢠ꣄
पेण्
ꢇꢤꣁ ꢦꣁꢡꢸꢮ꣄
ऊदा॑ पा॑दुव्
ꢓꢿꢱ꣄ ꢬꣂꢪ꣄
खेस् रोम
ꢡꢥꣁ
तनु
ꢭꣁꢞ꣄ꢞꢶ
ला॑ड्डि
ꢭꢵꢫꢪ꣄
लायम्
ꢦꢹꢱ꣄ ꢦꢸꢱꢶꢞꢶ
पूस् पुसिडि
ꢔꣁꢮꢡ꣄
गा॑वत्

Script - Birds

ꢦꢒ꣄ꢯꢶꢥ꣄ ꢒꢶꢥꢸ ꢡꢾꢭ꣄ꢫꢒ ꢂꢖ꣄ꢔꢸꢥ꣄
पक्षिन् किनु त॑ल्यक अङ्गुन्
ꢬꢵꢠꢸ ꢒꣃꢭꣁ
राणुकौला॑
ꢬꢵꢠꢸ ꢒꣃꢭꣁ
रानुकौला॑
ꢗꢛ꣄ꢗꢸ / ꢪꢸꢱ꣄ꢒꢶꢳꢶ
चञचु / मुस्किळि
ꢂꢪ꣄ꢱꣁ
हम्सा॑
ꢕꢸꢔꢸ / ꢆꢭꢸ
घुगु / उलु
ꢦꢶꢖ꣄ꢔꢸ / ꢦꢷꢦ꣄
पिङ्गु / पीप्
ꢦꢒ꣄ꢰꢶ ꢔꢹ
पक्षि गू
ꢬꢙꢒꣃꢭꣁ
रजकौला॑
ꢔꣃꢬꢶ
गौरि
ꢣꢶꢰ꣄ꢳꣁ
दिष्ळा॑
ꢒꣃꢭꣁ
कौला॑
ꢬꢪꣁ
रमा॑
ꢒꣁꢒꢶꢭ꣄
का॑किल्
ꢗꢶꢞꢶ
चिडि
ꢤꢔꣁ / ꢆꢭꢸ
धगा॑ / उलु
ꢦꢛ꣄ꢙꢶꢬꢶ꣄ / ꢥꢷꢞꣁ
पन्जिरि / नीडा॑
ꢮꢔꣁ
वगा॑
ꢄꢭꢶ / ꢘꢸꢭꢶ
हिलि / छुलि
ꢒꢸꢒꢸꢞꢶ / ꢒꢸꢞꢶ
कुकुडि / कुडि
ꢒꢸꢒꢸꢞꢶꢦꢶꢭ꣄ꢭꣁ
कुकुडिपिल्ला॑
ꢦꢶꢖ꣄ꢒꢸꢞꣁ
पिङकुडा॑
ꢒꢸꢒꢸꢞꣁ/ꢒꢸꢞꣁ
कुकुडा॑ / कुडा॑
ꢬꢪꣁ
रमा॑
ꢃꢞꢶ / ꢨꢣꢸꢭꣁ
आडि / बदुला॑
ꢮꢶꢱ꣄ꢡꢮ꣄ ꢒꢸꢞꢶ
विस्तव्कुडि
ꢦꢷꢦ꣄
पीप
ꢦꢶꢛ꣄ꢘꢾ / ꢪꢸꢡꢭꣁ / ꢦꢖ꣄ꢓꢸ
पिञछे / मुतला॑ / पङ्खु
ꢒꢸꢒ꣄ꢒꢸꢬꣁ
कुक्कुरा॑
ꢕꢵꢬꢸ
घारु
ꢦꢒ꣄ꢰꢶ
पक्षि
ꢒꣃꢣꢸ / ꢒꣁꢒ꣄ꢒꢸꢬ꣄ꢒꣀꢭꣁ
कौदु / का॑क्कुर्कैला॑
ꢨꣀꢭ꣄ ꢒꢸꢞꢶ
बैल् कुडि
ꢪꢴꣂꢬꢶ
म्होरि
ꢪꢴꣂꢬ꣄
म्होर्
ꢪꢴꣂꢬꢸ ꢦꢷꢒ꣄
म्होरुपीक्
ꢪꢴꣂꢬꢸ ꢦꢶꢖ꣄ꢒꢸ
म्होरुपिङकु
ꢙꢵꢞꢸ꣄ ꢜꢖ꣄ꢒꢸ ꢦꢒ꣄ꢰꢶ
जाडु टङकु पक्षि
ꢪꢴꢳꢶ ꢜ꣄ꢖꢒꢸꢥꢵꢬ꣄
म्हळिटङकुनार
ꢂꢠ꣄ꢞꣁ
अण्डा॑
ꢱꢬꢶꢒꣁ
सरिका॑
ꢡꢬꢱ꣄ꢮꢶꢥ꣄
तरस्विन्
ꢃꢞꢶ
आडि
ꢡꢬ꣄ꢦꢒ꣄ꢰꢶ
तर्पक्षि
ꢩꢵꢬꢙꢶ
भारजि
ꢏꢔꢸꢭ꣄
आ॑गुल

Script - Colors

ꢲꢶꢬ
हिर
ꢥꢡ꣄ꢡꢭ꣄
नत्तल
ꢒꣁꢪ꣄ꢨꢳꢮꢥꢶ
का॑म्ब्ळवनि
ꢒꣁꢪ꣄ꢨꢳ ꢦꣁꢭ꣄ꢱꣁ
का॑म्ब्ळपा॑ल्सा॑
ꢙꢾꢪ꣄ꢨ꣄ꢳ
जेम्ब्ळ
ꢒꢳꣁ
कळा॑
ꢥꢶꢳꣁ
निळा॑
ꢕꢾꢞꢶ ꢦꣁꢭ꣄ꢱꣁ
घ॑डिपा॑ल्सा॑
ꢒꢳ
कळ
ꢒꢵꢰ꣄ꢜꢸ
काष्टु
ꢬꢪꢵ ꢦꣁꢭ꣄ꢱꣁ
रमापाअ॑ल्सा॑
ꢱꢶꢬ꣄ꢒ꣄ꢒꢥ꣄
सिर्क्कन
ꢤꢹꢪ꣄ꢮꢥꢶ
धूम्वनि
ꢭꢴꣁꢮ꣄ꢮꣁ
ल्हा॑व्वो
ꢥꢵꢬ꣄ꢪꢹꢞꢶ
नार्मूडि
ꢮꢥꢶ
वनि
ꢯ꣄꣄ꢫꢵꢪꣁ / ꢥꢶꢭ
श्यामा॑ / निल
ꢦꣁꢭ꣄ꢱꣁ
पा॑ल्सा॑
ꢂꢳ꣄ꢞꢸꢥꣁ
हळ्डुना॑
ꢆꢙꢵꢳ꣄
हुजाळ

Script - Creatures


ꢚꢸꢭ꣄
झुल्
ꢗꢶꢔ꣄ꢭꣁ
चिग्ला॑
ꢱꢪ꣄ꢗꢳꢶ
सम्चळि
ꢱꢱꢬ꣄ꢦꢵꢛ꣄ꢚꢸꢭ꣄
ससर्पाञझुल्
ꢔꣁꢬꢸ ꢒꢵꢥꢸꢪ꣄ ꢒꢶꢞꣁ
गा॑रुकनुमकिडा॑
ꢆꢱꢸ ꢆꢱꢵꢭꢾ
उसुउसाल॑
ꢚꢸꢬꢸ
झुरु
ꢪꢸꢖ꣄ꢔꢶ
मुङगि
ꢲꢸꢥ꣄ꢣꢶꢬ꣄
हुन्दिर
ꢱꢬꢳ꣄
सरळ
ꢗꢵꢜꣁ
साटा॑
ꢔꢥ꣄ꢤꣁꢭꢶ / ꢔꢾꢥ꣄ꢤꢭ꣄
गन्धा॑लि / ग॑न्धल
ꢒꢖ꣄ꢒꢶꢞꣁ
किङकिडा॑
ꢨꢥ꣄ꢣꣁ
बन्दा॑
ꢲꢸꢡꢶ
हुति
ꢒꢺꢪꢶ
कृमि
ꢥꢸꢔꢸꢭ꣄ / ꢥꢒꢸꢭ꣄
नुकुल् / नकुल्
ꢱꢾꢛ꣄ꢙꢶꢮ꣄
स॑ञजिव्
ꢦꢶꢱꢸꢳꣁ
पिसुळा॑
ꢪꣃꢞꢶ
मौडि
ꢭꢴꣁꢮ꣄ꢮ ꢪꢸꢖ꣄ꢒꢶ
ल्हा॑व्व मुङकि
ꢆꢥ꣄ꢣꢶꢬ꣄
हुन्दिर्
ꢒꢸꢜ꣄ꢒꢶ
कुट्कि
ꢱꢸꢠ꣄ꢞꢶ
सुण्डि
ꢩꢾꢬ꣄ꢒꢳꢶ
भ॑र्कळि
ꢩꢿꢭꢶ
भेलि
ꢮꢶꢛ꣄ꢗꢸ
विञचु
ꢪꣀꢪꢴꢔꢶ
मैम्हगि
ꢔꢶꢱ꣄ꢳꣁ
गिस्ळा॑
ꢔꣁꢬꢪ꣄ꢪꣁ
गा॑रम्मा॑
ꢒꣃꢱ꣄ꢒꢶꢞꣁ
कौस्किडा॑
ꢦꢵꢭꣁ
पाला॑
ꢱꢵꢦ꣄
साप्
ꢂꢥ꣄ꢣꢸ
अन्दु
ꢒꢶꢞꣁ
किडा॑
ꢑꢳꢶ
औळि
ꢂꢨ꣄ꢨꢸ
हब्बु
ꢔꣂꢪ꣄ꢨꢾ
गोम्ब॑
ꢙꢹꢪ꣄
जूम
ꢱꢶꢣ꣄ꢣꢜ꣄
सिद्दट्
ꢙꢶꢙ꣄ꢙꢶꢭ꣄
जिज्जिल
ꢤꢾꢔꢸꢥꣁ
ध॑गुना॑
ꢦꢶꢖ꣄ꢔꢸ ꢪꢸꢖ꣄ꢔꢶ
पिङगु मुङगि
ꢃꢳꢶ
आळि
ꢢꣂꢳ꣄
थौळ
ꢔꣁꢭ꣄ꢭꣁꢬ꣄
गा॑ल्ला॑र

Script - Directions

ꢣꢫ꣄ꢬꣁ
दय्रा॑
ꢣꢫ꣄ꢬ
दय्र
ꢓꣃꢥꢱ꣄
खौनस
ꢣꢶꢒ꣄ꢒꢸ
दिक्कु
ꢣꢶꢱꣁ
दिसा॑
ꢣꢾꢒ꣄ꢰꢠ꣄
द॑क्षण्
ꢣꢾꢒ꣄ꢰꢓꣃꢥꢱ꣄
द॑क्षखौनस
ꢣꢾꢒ꣄ꢰꣁꢱ꣄ꢡꣁ
द॑क्षोस्ता॑
ꢆꢡ꣄ꢡꢬ꣄
उत्तर
ꢆꢡ꣄ꢓꣃꢥꢱ꣄
उखौनस
ꢆꢡ꣄ꢲꣁꢱ꣄ꢡꣁ
उत हा॑स्ता॑
ꢙꢫ꣄ꢥꣁ
जय्ना॑
ꢙꢫ꣄ꢥ
जय्न

Script - Ornaments

ꢂꢞ꣄ꢔꢾꢭ꣄
अड्ग॑ल
ꢒꢾꢣꢸꢬꣁ
क॑दुरा॑
ꢮꢱ꣄ꢡꢬ꣄
वस्तर्
ꢩꢹꢰꢸ / ꢱꣁꢪ꣄ꢪꢸ
भूसू / सा॑म्मु
ꢗꣁꢮ꣄ꢭꢶ
चा॑व्लि
ꢧꢾꢭꢸ
फेलु
ꢩꣁꢠ꣄ꢠꢪ꣄
भा॑ण्ण्म
ꢂꢥ꣄ꢡꢬ꣄ꢮꢵꢱ꣄
अन्तर्वास्
ꢏꢞ꣄ꢞꢶꢫꢠꢪ꣄
आ॑ड्डियणम्
ꢂꢞꢸꢗꣁꢮ꣄ꢭꢶ
अडुचा॑व्लि
ꢣꣁꢠꣁ / ꢘꢵꢱ꣄ꢪꣁ
दा॑णा॑ / छास्मा॑
ꢓꢵꢡꢶ
खाति
ꢡꣃꢠꢞ꣄
तौणट
ꢡꢮ꣄ꢠꢣ꣄
तव्णड्
ꢒꢾꢖ꣄ꢔꢠ꣄
क॑ङगण्
ꢦꢵꢛ꣄ ꢂꢖ꣄ꢔꢬꣁ
पाञ अङगरा॑
ꢒꢸꢖ꣄ꢔꢸꢪ꣄
कुङगुम्
ꢱꢡꢶ
सति
ꢦꣁꢖ꣄ꢔꢸꢳꣁ
पा॑ङगुळा॑
ꢦꣀꢞꢶ
पैडि
ꢭꢴꣂꢖ꣄ꢔꢸ
ल्हा॑ङगु
ꢲꢵꢡꢸꢪꢔꢵ ꢨꣁꢜ꣄ꢞꣁ
हादुमगा बा॑ट्डा॑
ꢒꢸꢛ꣄ꢙꢪ꣄
कुञजम्
ꢦꣁꢖ꣄ꢔꢸꢳꣁ
पोङगुळा॑
ꢒꢾꢣꢸꢬꣁ
क॑दुरा॑
ꢗꣀꢪ꣄ꢨꢜ꣄ꢜꢾ / ꢔꣁꢬ꣄ꢱꢸꢭ꣄
चैम्बट्ट॑ / गा॑र्सुल
ꢒꢰ꣄ꢜꢶꢨꣁꢜ꣄ꢜꣁ
कस्टि बा॑ट्टा॑
ꢔꣁꢪꢾꢣꢒꢪ꣄
गा॑मेदकम
ꢂꢖ꣄ꢔ꣄ꢬꣁ
अङगरो
ꢂꢖ꣄ꢔ꣄ꢬꢵ / ꢓꣃꢭ꣄ꢜꢶ
अङगरा / खा॑ल्टि
ꢬꢖ꣄ꢔꢵꢮ꣄
रङगाव्
ꢣꣁꢠ꣄ꢞꣁ
द॑ण्डा॑
ꢨꢶꢥ꣄ꢣꢸꢭꣁ
बिङदुला॑
ꢭꢴꣂꢖ꣄ꢔꢸ
ल्होङदु
ꢭꣁꢭꢵꢒ꣄
लोलाक
ꢪꣁꢛ꣄ꢗꢥꢶ
मा॑ञचनि
ꢗꢸꢗ꣄ꢗꢸꢪ꣄
चुच्चुम्
ꢦꣃꢱꢸꢭ꣄ / ꢗꢾꢦꢶꢥꢶ
पौसुल / च॑पिनि
ꢱꣁꢳꣁ
सौळा॑
ꢗꣁꢮ꣄ꢳꢶ
चोव्ळि
ꢔꣁꢬ꣄ꢱꢸꢭ꣄
गा॑र्सुल्
ꢣꢥ꣄ꢡꢸ
दन्दु
ꢆꢰ꣄ꢠꢶꢰꣁ
उष्णिषा॑
ꢗꢾꢪ꣄ꢨꢜ꣄ꢜꢾ / ꢚꢭ꣄ꢚꢭ꣄
च॑म्बट्टे / झल्झल्
ꢦꢭꣁ
पला॑
ꢑꢡꣁ
औता॑
ꢒꢸꢜ꣄ꢒꣁ
कुट्का॑
ꢨꣁꢜ꣄ꢜꣁ
बा॑ट्टा॑
ꢒꢱ꣄ꢥꢶ
कस्नि
ꢦꢔꢶꢞꢶ
पगिडि
ꢡꣃꢠꢜ꣄
तौणट
ꢩꢹꢰꢠ
भूषण
ꢥꢶꢭꢣꢾꢫ꣄ꢞ
निलद॑य्ड
ꢦꢶꢪ꣄ꢨꢭꢪ꣄
पिम्बलम
ꢒꣃꢱ꣄ / ꢒꣁꢮ꣄ꢯ꣄
कौस / का॑व्श्
ꢪꢬꢔꢡꢪ꣄
मरगतम्
ꢦꣁꢪ꣄ꢳꣁ
पा॑म्ळा॑
ꢭꣁꢪ꣄ꢨꢞꢪ꣄
ला॑म्बडम
ꢔꣁꢠꢪ꣄
गा॑ण्म्
ꢨꢶꢭꢵꢒ꣄
बिलाक्
ꢦꢸꢰ꣄ꢦꢬꢵꢔꢪ꣄
पुश्परागम्
ꢨꣀꢙꢪꢵ
बैजमा
ꢧꢖ꣄ꢔꢸꢬꣁ
फङगुरा॑
ꢪꢬꢔꢡꢪ꣄
मरगतम्
ꢦꣃꢒꢳ꣄
पौकळ
ꢪꢵꢠꢶꢒ꣄ꢒꢪ꣄
माणिक्कम्
ꢃꢬꢪ꣄ / ꢪꢵꢭꢾ
हारम् / माल॑
ꢮꢶꢛ꣄ꢗꢸ / ꢦꢵꢛꢶꢪꢸꢣ꣄ꢣꢶ
विञचु / पाञिमुद्दि
ꢤꣁꢮꢡ꣄
धा॑वत्
ꢪꣁꢡꢶ
मा॑ति
ꢪꢸꢒ꣄ꢬꣁ / ꢘꢵꢱ꣄ꢪꣁ
मुक्रा॑ / छास्मा॑
ꢪꢸꢒ꣄ꢒꢸꢬ꣄
मुक्कुर्
ꢪꢸꢣ꣄ꢣꢶ
मुद्दि
ꢭꣁꢭꢵꢒ꣄
ला॑लाक्
ꢒꣀꢥ
कैन
ꢒꣀꢥꣁ
कैना॑
ꢂꢬꢶꢡ꣄ꢯꢪ꣄
हरितशम्
ꢚꢸꢖ꣄ꢒꢭ꣄
झुङकल्

Script - Earth

ꢆꢦꢡ꣄ꢫꢒꣁ
उपत्यका॑
ꢱꢥ꣄ꢤꢶ
सन्धि
ꢱꢾꢡꢸ
सेदु
ꢂꢳ / ꢱꢾꢡꢸ
अळ / सेदु
ꢚꢬꢶ
झरि
ꢭꢵꢜ꣄
लाट्
ꢱꢸꢥ꣄ꢣꢸꢬ꣄
सुन्दुर्
ꢥꢾꢣ꣄ꢣꢶ
न॑द्दि
ꢦꢮꢶ
पवि
ꢪꣁꢱ꣄ꢫꢵꢥ꣄
मा॑स्यान्
ꢦ꣄ꢬꢒꢺꢡꢶ
प्रुकृति
ꢆꢥ꣄ꢣꢬ꣄
हन्दार्
ꢂꢥ꣄ꢣꢬ꣄
हन्दार्
ꢒꢱꢸ
कसु
ꢲꢸꢳꢵꢔ꣄ꢔꢶꢬꢶ
हुळाग्गिरि
ꢡꢳꣁ
तळा॑
ꢱꢾꢣ꣄ꢣꢸ
स॑द्दु
ꢲꢸꢙꢵꢳ꣄
हुजाळ
ꢱꢨ꣄ꢣꢸ
सब्दु
ꢦꣁꢥ꣄ꢣꣁ
बा॑न्दा॑
ꢨꣁꢥ꣄ꢣꢸꢬ꣄
सुन्दुर्
ꢆꢥ꣄ꢣꢸꢬꢸꢡꢷꢬꢸ
सुन्दुरुतीरु
ꢓꢠ꣄ꢞꢪ꣄
खण्डम्
ꢗꢶꢞꢵꢫ꣄ꢣꢾꢞꢸꢜꣁ / ꢒꢭꢣꢾꢔꢸꢜꣁ
चिडाय द॑गुटा॑ / कलद॑गुटा॑
ꢡꢷꢬꢸ
तीरु
ꢗꢶꢞꢪꢡ꣄ꢡꢶ / ꢗꢶꢔꢸꢜ꣄ꢜꢪ꣄ꢡꢡꢶ
चिडमत्ति / चिगुट्टमत्ति
ꢣꢵꢬꢸ / ꢤꢵꢡꢸ
दारु / धतु
ꢬꢵꢠ꣄ / ꢮꢥꢪ꣄
राण् / वनम्
ꢪꢷꢜꢸ ꢡꢳꣁ
मीटु तळा॑
ꢒꣃꢭꣁ
कौला॑
ꢮꢬꣁ
वरा॑
ꢪꢬꢶꢥ꣄ / ꢦꢥ꣄ꢪꢬꢶꢥ꣄
मरिन् / पन्मरिन्
ꢲꢷꢬ꣄
हीर्
ꢕꢸꢦꣁ
घुपा॑
ꢱꣁꢬꣁ
स॑रा॑
ꢱꢸꢥ꣄ꢣꢸꢬꢸꢒꢸꢒ꣄ꢰꢶꢱꢸꢥ꣄ꢡꢸꢬꢲꢷꢦꢸ
सुन्दुरु कुक्षि / सुन्तुर् हीपु
ꢨꢸꢱꢸꢪ꣄ꢨꢸꢞ꣄ꢞꣁ
बुसुम्बुड्डा॑
ꢓꣃꢬꢶ
खौरि
ꢕꢷꢬ꣄ / ꢥꢶꢥ꣄ꢥꣁ
धीर् / निन्ना॑
ꢔꢶꢬꢶ ꢬꢵꢠ꣄
गिरि राण्
ꢣꣁꢖ꣄ꢔꢬ꣄
दा॑ङगर्
ꢒꢒꢸꢣ
ककुद
ꢱꢖ꣄ꢔꢪꢪ꣄
सङगमम्
ꢡꢭꢵꢡꢵꢪ꣄
तलाताम्
ꢱꢥ꣄ꢣ꣄ꢫꢵ
सन्द्या
ꢱꢾꢥ꣄ꢡꢸ
स॑न्दु
ꢪꢲꢵꢱꢵꢔꢬꢪ꣄
महासागरम्
ꢗꢶꢞꢵꢫ꣄
चिडाय्
ꢗꢶꢞꢫ꣄ꢣꢾꢫ꣄ꢞꣁ
चिडाय् द॑य्डा॑
ꢮꢵꢜ꣄ / ꢬꢾꢱ꣄ꢡ
वाट् / र॑स्त
ꢡꣂꢱ꣄
तोस्
ꢪꣁꢱ꣄ꢫꢵꢥ꣄
मा॑स्यान्
ꢤꢮꢵꢮꢵꢜ꣄
धवावाट्
ꢕꢸꢮ꣄ꢮꣁ
घुव्वा॑
ꢃꢮꢬ꣄ꢡꢸ
आवर्तु
ꢃꢮꢬ꣄ꢡꢸꢮꢬꣁ
आवर्दु वरा॑
ꢱꢸꢬꢶꢮꢬꣁ
सुरिवरा॑
ꢬꢪꢡ꣄ꢡꢶ
रमत्ति
ꢦꣁꢜ꣄ꢒ꣄ꢫꢵꢜ꣄
पा॑ट्क्याट्
ꢗꢒ꣄ꢒꢶꢭ꣄
सक्किल्
ꢪꢵꢬ꣄ꢔꢪ꣄
मार्गम्
ꢧꢹꢭꢸꢡꢳꣁ
फूलुतळा॑
ꢦꢷꢒ꣄ ꢥꢴꢷꢡ꣄ꢡ ꣄ꢢꢵꢪ꣄
पीक् न्हीत्त थाम्
ꢡꢭꢪ꣄ / ꢩꢸꢡꢭꢪ꣄
तलम् / भूतलम्
ꢤꢵꢡꢸ
धातु
ꢤꢵꢡꢸꢮꢱ꣄ꢡꢸ
धतुवस्तु
ꢆꢳꢵ ꢔꣁꢳꣁ
हुळा गा॑ळा॑
ꢣꢷꢦ ꢔꢬ꣄ꢦꢸ
दीप गर्पु
ꢣꢶꢮꢸ
दीवु
ꢡꢵꢬꢸ ꢱ꣄ꢡꢭ꣄
तारु स्थल्
ꢤꢹꢳꢶ / ꢙꢾꢙ꣄ꢙꢸ
धूळि / जेज्जु
ꢮꢷꢡ꣄ / ꢦꢳꣁ
वीत् / पळा॑
ꢣꢶꢒꢥ꣄ꢡꢸ
दिकन्तु
ꢩꢸꢛ꣄~
भुञ्~
ꢗꣀꢭꣁ / ꢥꢷꢞꣁ
चैला॑ / नीडा॑
ꢦꢥꢶ
पनि
ꢂꢮ꣄ꢬꢶ / ꢑꢬꢶ
अव्रि / औरि
ꢦꢥ꣄ꢬꢾꢪ꣄
पन्रेम्
ꢦꢥꢶ ꢱ꣄ꢢꢶꢡꢶ
पनि स्थिति
ꢚꢬꢶ
झरि
ꢒꢱꢸ
कसु
ꢦꢥ ꣄ꢤꢵꢪ꣄
पन्धाम्
ꢦꢷꢥ꣄
फीन्
ꢂꢨ꣄ꢬꢥꢶ ꢤꢬꢶꢬ꣄
अब्रनि धरिर्
ꢪꢲꢵ ꢕꢷꢬ꣄
महा घीर्
ꢦꢣꢵꢳ꣄
प्दाळ्
ꢱꢿꢡꢸ
सेदु
ꢮꢭꢸ ꢬꢵꢠ꣄ / ꢮꢭꢸ ꢮꢥ
वळु राण् / वळु वन
ꢦꢵꢬꣁ
पारा॑
ꢆꢜꢵꢮ꣄ / ꢦ꣄ꢬꢒꢵꢰ꣄
उटाव् / प्रकाष्
ꢱꢪꢱ꣄ꢢꢭ꣄
समस्थल
ꢚꢸꢛ꣄ꢙꢸ
झुञ्जु
ꢩꢸꢛ꣄
भुञ्
ꢤꢹꢳꢶ
धूळि
ꢩꢸꢄ~ ꢓꢶꢠꣀꢥꢶ / ꢩꢸꢒꢪ꣄ꢦꢸ
भुइ~ खिणैनि / भुकम्पु
ꢪꢃꢱꢸꢥ꣄ꢣꢸꢬ꣄
महासुन्दुर्
ꢪꢴꣁꢜ꣄ ꢚꢬꢶ
म्हा॑ट्झरि
ꢩꢸꢬ꣄ꢒꣁ / ꢗꢹꢬ꣄ꢠꢸ
भुर्का॑ / चूरणु
ꢲꢶꢬꣁ / ꢣꢪꢬ꣄ ꢡꢳꣁ
हिरा॑ / दमर्तळा॑
ꢱꢢꢶꢡꢶ
सथिति
ꢪꢡ꣄ꢡꢶ
मत्ति
ꢮꢳꢸ
वळु
ꢮꢳꢸꢡꢶꢦ꣄ꢦꣁ
वळुतिप्पा॑
ꢮꢳꢸꢪꢶꢜ꣄ꢜꣁ
वळुमिट्टा॑
ꢪꣁꢯ꣄꣄ꢫꢵꢥ꣄
मा॑श्यान्
ꢦꢷꢒꢸꢤꢬꢶꢬ꣄
पीकुधरिर्
ꢣꣁꢖ꣄ꢔꢬ꣄ / ꢔꢶꢬꢶ
दा॑ङगर् / गिरि
ꢔꢶꢬꢶꢚꢶꢬ꣄ꢮꢵꢜ꣄
गिरि झिर्काव्
ꢡꣁꢖ꣄ꢔꢬ ꣄ꢮꢵꢜ꣄
दा॑ङगर्वाट्
ꢡꣁꢖ꣄ꢒꢬ꣄ꢡꣁꢬꢠ꣄
दा॑ङकर्तोरण्
ꢗꢦꢭ꣄ / ꢮꢶꢣ꣄ꢫꢸꢡ꣄
चपल् / विद्युत
ꢥꢴꢵꢥ꣄ꢮꢷꢡ꣄
न्हान्वीत्
ꢮꢥꢵꢥ꣄ꢡꢶꢬ
वनान्तिर
ꢪꣁꢥꣁ
मा॑ना॑
ꢮꢬꣁ
वरा॑
ꢂꢓꢵꢣꣁ
अखादा॑
ꢮꢵꢜ꣄
वाट्
ꢮꢷꢡ꣄
वीत्
ꢮꢾꢭ꣄ꢮꣁ / ꢦ꣄ꢬꢮꢵꢲ
वेल्वो / प्रवाह
ꢦꢥ꣄ꢰꢥ꣄ꢣꢶ
पन्सन्दि

Script - Education

ꢂꢒꢬꢵꢡꢶ / ꢥꢶꢒꢠ꣄ꢜꢸ / ꢒꣂꢰ꣄
अकराति / निकण्टु / कोष
ꢂꢤ꣄ꢫꢵꢫ꣄
अध्याय
ꢮꢶꢣꢿꢯꢸ ꢩꢵꢰꣁ
विदेशु भाषा॑
ꢬꢵꢙꢥꢷꢡꢶ
राजनीति
ꢬꢵꢙꢥꢷꢡꢶ ꢱꢵꢱ꣄ꢡ꣄ꢬꢸ / ꢬꢵꢙꢥꢷꢡꢶ ꢛꢵꢥ꣄
राजनीति सास्त्रु / राजनीति ञान्
ꢒꢵꢬ꣄ꢫꢵꢭꢫꣁ
कार्यलया॑
ꢱꢣꢸꢰ꣄ꢜꢪ꣄ / ꢱꢾꢔꢸꢠ / ꣄ ꢱꢹꢱꢥꣁ
सदुष्टम् / स॑गुन / सूचना॑
ꢮꢶꢔ꣄ꢛꢵꢥ꣄
विगञान्
ꢮꢣ꣄ꢣꢶ / ꢏꢣ꣄ꢣꢶ
वद्दि / आ॑द्दि
ꢏꢬ꣄ꢱꢸꢦꢬꢶꢰꢾ / ꢮꢵꢬ꣄ꢯꢶꢒ ꢦꢬꢶꢒ꣄ꢰꣁ
आ॑र्सुपरिक्षो / वार्षिक परिक्षो
ꢏꢬ꣄ꢱꢸꢮꣀꢩꢮ꣄
आ॑र्सुवैभव्
ꢱꢪ꣄ꢱꣂꢤꢥꣁ
सम्सोधना॑
ꢱꢪ꣄ꢱꣂꢤꢥꢱꢵꢭꣁ
सम्सोधनसाला॑
ꢱꢪ꣄ꢱꣂꢤꢥꢵꢦꣁꢡꢶ
सम्सोधनापा॑ति
ꢱꢪ꣄ꢱꣂꢤꢥꢵ
सम्सोधना
ꢮ꣄ꢫꢒ꣄ꢡꢶꢩꢵꢮ꣄ / ꢱ꣄ꢮꢩꢵꢮ꣄
व्यक्तिभाव् / स्वभाव्
ꢱꢪꢡ꣄ꢡꢸ / ꢥꢶꢦꢸꢠꢡ꣄ꢮꣁ
समत्तु / निपुणत्वा॑
ꢱꢖ꣄ꢒꢷꢡ ꢒꢠ꣄ꢱꢵꢭꣁ
सङकीतकलासाला॑
ꢦ꣄ꢬꢒꢺꢡꢶ
प्रकृति
ꢮ꣄ꢫꢵꢒꢬꢠꣁ
व्याकरणा॑
ꢱꢵꢲꢶꢡ꣄ꢫꣁ
साहित्या॑
ꢔ꣄ꢣ꣄ꢫꣁ
गद्या॑
ꢱꢪ꣄ꢩꢵꢰꢠꣁ
सम्भाषणा॑
ꢭꢶꢓ꣄꣄ꢭꣁ
लिख्ला॑
ꢡꢬꢾ
तरा॑
ꢮ꣄ꢫꢵꢱꣁ
व्यासा॑
ꢭꢾꢓꢸ
लेखु
ꢭꢴꢾꢓꣁ / ꢲꢷꢱꢸ
ल्ह॑खा॑ / हीसु
ꢔꢠꢶꢶꢡ꣄
गणित्
ꢓꢾꢥꢶ / ꢓꢾꢡꣁ
ख॑नि / ख॑ता॑
ꢂꢩꢶꢦ꣄ꢬꢵꢫꢸ ꢱꢣꢱ꣄
अभिप्रायु सदस
ꢒꢭꢵ ꢱꢵꢭꣁ
कलासाला॑
ꢅꢔꢸ ꢮꢶꢣ꣄ꢫꣁ ꢗꢾꢣꢸꢮ꣄
ईगु / विद्या॑ / च॑दुव
ꢒꢮꢶ
कवि
ꢒꢮꢶꢡꣁ
कविता॑
ꢄꢔꢞꢱ꣄ꢡꢿ
इगडस्ते
ꢗꢾꢮ꣄ꢣꢶꢥꢶ / ꢱꢶꢒ꣄ꢒꢶꢥꢶ
च॑व्दिनि/सिक्किनि
ꢒꢳ꣄꣄ꢙꢪ꣄
कळ्जम्
ꢒꢵꢮ꣄ꢫꣁ
काव्या॑
ꢱꢹꢗꢥꣁ
सूचना॑
ꢱꢹꢗꢥꢵꢦꣁꢡꢶ
सूचनापा॑ति
ꢎꢒꢶ ꢭꢶꢓꢶꢥꢶ
ऐकि लिखिनि
ꢦꢸꢱ꣄ꢥꢶ / ꢦꢸꢱꢵꢮ꣄
पुस्नि / पुसाव्
ꢲꢵꢡꢰꢬ꣄
हातक्षर्
ꢲꢵꢡꢸꢦꣁꢡꢶ
हातुपोति
ꢲꢱ꣄ꢡꢰꢬ꣄
हस्तक्षर्
ꢥꢷꢡꢶꢥꢶꢫꢪꣁ
नीतिनियमा॑
ꢱꢶꢣ꣄ꢤꢵꢥ꣄ꢡꢸ
सिद्धान्दु
ꢗꢶꢡ꣄ꢬꢸ / ꢭꣂꢱꢸ / ꢗꢶꢡ꣄ꢡꢬ꣄
चित्रु / लोसु / चित्तर्
ꢫꣂꢗꢥꣁ
योच
ꢥꢥ꣄ꢓꢾꢥꢶ
न:न्खेनि
ꢭꣀꢒꢵꢱꢸꢒꢳ꣄ꢙꢾꢪ꣄ / ꢱꢪꢵꢗꢵꢬꢸꢦꢡ꣄ꢬꣁ
लौकासु कळ्जम् / समाचारुपत्रा॑
ꢔꢮ꣄ꢥꣁ / ꢦꢣ꣄ꢫꢪ꣄ / ꢱ꣄ꢭꣂꢒ꣄
गव्नो / पद्यम / स्लोक्
ꢮꢡ꣄ꢡꣁ
वत्ता॑
ꢒꣁꢰ꣄ / ꢱꢨ꣄ꢣ ꢩꢠ꣄ꢞꢵꢬ꣄
कोष / सब्द पण्डार
ꢱꣁꢤꢥꣁ / ꢦꢬꢷꢒ꣄ꢰꣁ
सोधना॑ / परीक्षो
ꢪꢥ꣄ꢡꢸ / ꢗꢹꢒ꣄ / ꢒꢸꢠ꣄ꢜꢸ
मन्तु / छूक् / कुण्टु
ꢪꢵꢫ꣄ ꢩꢵꢰꣁ / ꢪꢵꢡ꣄ꢬꢸꢩꢵꢰꣁ
माय्भाषा॑ / मात्रुभाषा॑
ꢒꢭ꣄ꢙꢾꢪ꣄
कल्जेम्
ꢥꣀꢦꢸꢠ꣄ꢫ
नैपुण्य
ꢮꢶꢪꢬ꣄ꢱꢥꣁ / ꢔꢸꢠꢣꣂꢰ ꢮꢶꢗꢵꢬ꣄
विमर्सना॑ / गुणदोष विचार
ꢮꢶꢩꢵꢔ꣄
विभाग्
ꢦꢬꢷꢰꢾ
परीक्षे
ꢦꢬꢷꢰꢵ ꢢꢵꢪ꣄
परीक्षा थाम्
ꢃꢬꢪ꣄ꢩ ꢲꢸꢬꢶ
आरम्ब हुरि
ꢮꢡ꣄ꢡꢵ ꢡꣁꢬꢠ꣄
वत्ताता॑रण
ꢗꢵꢭ꣄ꢗꢭꢥ꣄ / ꢗꢭ꣄ꢥꢶ
चाल्चलन् / चल्नि
ꢥꢜꢥꣁ
नटना॑
ꢥꢵꢗꢸ
नाचु
ꢭꣁꢒ꣄ꢓꢾꢥꢶ
लोक्ख॑नि
ꢭꣂꢒ꣄ꢔꢷꢡ꣄ / ꢣꢿꢱꢶꢔꢷꢡ꣄
लोक्गीत् / देसिगीत
ꢦꣁꢡꢶ / ꢦꢸꢱ꣄ꢡꢮ꣄ / ꢦꢸꢱ꣄ꢡꢶꢒꣁ
पा॑ति / पुस्तव् / पुस्तिका॑
ꢦꣁꢡꢶꢔ꣄ꢕꢿꢬ꣄ / ꢩꢠ꣄ꢞꢵꢬꢸꢕꢿꢬ꣄
पा॑तिघेर् / भण्डारुघेर्
ꢮꢬ꣄ꢠꢪꢵꢭꣁ
वर्णमाला॑
ꢭꢒ꣄ꢰ꣄꣄ꢫꣁ / ꢤ꣄ꢫꢾꢫꢸ
लक्ष्या॑ / ध्येयु
ꢦꣁꢒ꣄ / ꢦꢸꢜꣁ
पोक् / पुटा॑
ꢱ꣄ꢥꢵꢡꢒꣁ
स्नातका॑
ꢆꢦꢵꢤꢶ
उपाधि
ꢗ꣄qꢡꢸꢮ꣄ ꢒꣁꢜ꣄ꢜꣁ ꢮꢵꢗꢒꢱꢵꢭꣁ
च॑तुव्का॑ट्टा॑ वाचकसाला॑
ꢗꢾꢣꢸꢮ꣄ / ꢅꢔ꣄
च॑दुव् / ईग्
ꢧꢬꢪ꣄
फरम्
ꢬꢱꢶꢥꢶ
रचिनि
ꢱꢛ꣄ꢗꢶꢒꣁ
सञ्चिका॑
ꢙꢾꢮꢵꢦ꣄
ज॑वाप्
ꢂꢩ꣄ꢫꢵꢱ꣄
अभ्यास्
ꢙꢿꢪ꣄ / ꢦꢵꢬꢶꢡꣂꢱꢶꢒꣁ
जेम् / पारितोसिका॑
ꢦꢬꢶꢱꣁꢤꢥꣁ
परिसोधना॑
ꢦꢬ꣄ꢒ꣄ꢰꣁ
परिक्षो
ꢱꢬ꣄ꢮꢒꢭꢵꢱꢵꢭꣁ
सर्वकलासाला॑
ꢲꢸꢬꢶ
हुरि
ꢙꢸꢥ꣄ꢥꢮꢵꢗꢸ / ꢦ꣄ꢬꢵꢮꢵꢗꢸ
जुन्नवाचु / प्रावाचु
ꢔꢷꢡ꣄
गीत्
ꢦꢵꢝꢮꢶꢮꢬꢠꣁ
पाठविवरणा॑
ꢦꢵꢝꢦꢸꢱ꣄ꢡꢮ꣄
पाठ्पुस्तव्
ꢦꢵꢝ꣄
फठ
ꢦꣁꢬꣁ / ꢪꢥ꣄ꢡꢸ
पा॑रा॑ / मन्तु
ꢦꣁꢡꢶ
पा॑ति
ꢭꢵꢪ꣄ꢓꢾꢥꢶ
लाम्ख॑नि
ꢥꣁꢮ꣄ꢮꢒꢮꢶꢡꣁ
ना॑व्वकविता॑
ꢦꢸꢬꢵꢠꣁ
पुराणा॑
ꢪꢴꢵ ꢏꢣ꣄ꢣꢶ
म्हा आ॑द्दि
ꢭꢶꢒ꣄ꢭꣁ
लिक्ला॑
ꢮꢶꢰꢫꢸ
विषयु
ꢫꢥ꣄ꢡ꣄ꢬꢸꢮꢶꢣ꣄ꢫꣁ / ꢫꢥ꣄ꢡ꣄ꢬꢸ ꢮꢶꢔ꣄ꢛꢵꢥ꣄
यन्त्रु विद्या॑ / यन्त्रु विग्ञान्
ꢦꣁꢥ꣄ꢡꢶ / ꢱ꣄ꢦꢬ꣄ꢤꣁ
पा॑न्ति / स्वर्धा॑
ꢏꢫ꣄ꢣꢦꢥ꣄
आ॑य्दपन्न
ꢲꣁꢔꢡ꣄
हा॑गत्
ꢥꢴꢸꢬꢸꢥꢸ ꢲꢸꢬꢶ
न्हुरुनु हुरि
ꢮꢶꢣ꣄ꢫꢵꢬ꣄ꢡꢶ
विद्यार्ति
ꢮꢶꢣ꣄ꢫꢵꢬ꣄ꢡ꣄ꢡꢶꢥꢶ
विद्यार्त्तिनि
ꢧꣀꢭꢮꢬ꣄ꢔꢸ
फैलवर्गु
ꢦ꣄ꢬꢤꢵꢥꣁꢣ꣄ꢣꢶ
प्रधान् आ॑द्दि
ꢧꣀꢭꢯ꣄꣄ꢬꢿꢥꢶ
फैलश्रेनि
ꢪꣀ
मै
ꢩꢵꢰꣁ
भाषा॑
ꢩꢵꢰꢵ ꢬꢷꢡꢶ
भाषा रीति
ꢩꢵꢰꢵ ꢪꢬ꣄ꢗꢶꢥꢶ / ꢂꢥꢸꢮꢵꢣ꣄ / ꢩꢵꢱꢵꢥ꣄ꢡꢬ꣄ / ꢡꢬ꣄ꢙꢪꣁ
भाषा मर्च्चिनि / अनुवाद् / भाषान्तर् / तर्जमा॑
ꢩꢵꢰꢵꢮꢶꢔ꣄ꢛꢵꢥ꣄
भाषाविगञान
ꢮꢬ꣄ꢒꢸ
वर्कु
ꢗꢬꢶꢡ꣄ꢬꢸ
चरित्रु
ꢮꢡ꣄ꢡꣁ / ꢯꢨ꣄ꢣꢸ ꢴ
वत्त / शब्दु
ꢮꢔ꣄ꢛꢵꢥ꣄
विगञान
ꢮꢔ꣄ꢛꢵꢥꢶ
विगञानि
ꢯꣁꢞ꣄ꢠꢶ/ꢯꣂꢞꢸ
सा॑ड्णि/शोडु
ꢱꣁꢞ꣄ꢮꢵꢬ꣄
सा॑ड्वार
ꢙꢮꢵꢨ꣄
जवाब्
ꢮꢶꢮꢵꢡ꣄
विवात्
ꢦ꣄ꢬꢰ꣄ꢥꣁ/ ꢦꢸꢱꢶꢥꢶ/ ꢦꢸꢱꢵꢮ꣄
प्रष्णा॑ / पुसिनि / पुसाव
ꢦ꣄ꢬꢰ꣄ꢥ ꢦꢡ꣄ꢬꣁ
प्रष्न पत्रा॑
ꢒꣁꢪ꣄ꢪꢵ ꢂꢩ꣄ꢫꢵꢱ꣄
गा॑म्मा अभ्यास्

Script - Festival

ꢗꢶꢜ꣄ꢜꢶꢣꢶꢮꣁ
चिट्टिदिवा॑
ꢡꢶꢥ꣄ꢥꢳ꣄꣄ / ꢱꢾꢥ꣄ꢥꢸ
तिन्नाळ / स॑न्नु
ꢒꣀꢖ꣄ꢒꢬ꣄ꢫꢣꢵꢥ꣄ / ꢱꢸꢣꢵꢥ꣄ / ꢗꣁꢒ꣄ꢣꢵꢥ꣄
कैङकर्यदान् / सुदान् / चोक्दान्
ꢣꢶꢮꢭꢶ
दिवलि
ꢡꣁꢬꢠ꣄
तोरण्
ꢏꢔꢡ꣄
ओगत्
ꢦꣁꢜ꣄ꢜꢵꢱ꣄ / ꢨꢠꢵꢭ꣄
पा॑ट्टास् / बणाल्
ꢮꢶꢯꢾꢰ꣄ / ꢱꢾꢥ꣄ꢥꢸ
विशेष् / स॑न्नु
ꢦꣁꢖ꣄ꢒꢭ꣄ ꢱꢾꢥ꣄ꢥꢸ / ꢪꢒꢬ ꢱꢖ꣄ꢒ꣄ꢬꢵꢥ꣄ꢡꢶ
पोङकल् स॑न्नु / मकर सङ्क्रान्ति

Script - Food


ꢓꢮ꣄ꢥꢪ꣄
खव्नम
ꢨꣁꢭꢵꢤꢶꢞꣁ / ꢂꢜꣀ
ब॑लाधिडा॑ / अटै
ꢦꢸꢬꢶ
पुरि
ꢂꢦ꣄ꢦꢸꢞꢵꢭ꣄
अप्पुडाल्
ꢂꢜ꣄ꢒꢸꢭ꣄
अट्कुल्
ꢒꢫ꣄ꢫꢵꢥ꣄ ꢡꢾꢳ꣄ꢥꢶ
कय्यान्त॑ळ्नि /
ꢂꢲꢵꢬ꣄
अहार्
ꢂꢦ꣄ꢦꢪ꣄
अप्पम्
ꢩꢭꢵꢬ꣄ / ꢮꢶꢳ꣄꣄ꢜꢶꢫꣁ / ꢆꢒ꣄ꢒꢸꢜꢸꢪ꣄
फ्लार् / विळ्टिया॑ / उक्कुटुम्
ꢄꢜꢶꢫꢵꢦ꣄ꢦꢪ꣄
इटियाप्पम्
ꢕꢜꢮ꣄ꢥꢭ꣄ / ꢱꢮ꣄ꢥꢭ꣄
घटव्नल् / सव्नल्
ꢗꣀꢥꣁ / ꢨꣁꢱꢸꢭꣁ / ꢪꢵꢪ꣄ꢱꢸ / ꢓꣁꢮ꣄ꢱ꣄
चैना॑ / बा॑सुला॑ / माम्सु / खा॑व्स
ꢓꢥꢶ / ꢓꢮ꣄ꢥꢪ꣄
खनि / खव्नम
ꢆꢦ꣄ꢪꢵꢮ꣄
उप्माव्
ꢒꢗ꣄ꢗꢪ꣄ꢩꢵ ꢂꢪ꣄ꢨꢜ꣄
कच्चम्बा अम्बट्
ꢨꢶꢙ꣄ꢙꢜ꣄ / ꢭꣁꢰ꣄ꢜꣁ
बिज्जट् / ला॑ष्टा॑
ꢡꢷꢭꢸ ꢆꢠ꣄ꢜꣁ
तीलु उण्टा॑
ꢒꢾꢥ꣄ꢥꢶꢦꢾꢱ꣄
क॑न्निपेस
ꢔꣁꢨ꣄ꢨꢸꢬꢾꢱ꣄ꢱꢸ
गा॑ब्बु र॑स्सु
ꢒꣁꢞ꣄ꢞꢶ
का॑ड्डि
ꢒꢾꢳ꣄ꢳꢸ
क॑ळ्ळु
ꢱꢸꢔꢸꢞ꣄
सुगुड्
ꢗꣀꢭꢡ꣄ꢡꢾ
चैलत्त॑
ꢗꢥꣁ
चैना॑
ꢨꢾꢠ꣄ꢞꢸꢗꢥꣁ / ꢨꣁꢱꢸꢭꣁ
ब॑ण्डुचैना॑ / बा॑सुला॑
ꢒꢸꢞꢶꢗꢥꣁ
कुडिचैना॑
ꢣꢸꢒ꣄ꢒꢬꢸꢗꢥꣁ
दुक्करुचैना॑
ꢒꣁꢬꢸꢗꣀꢥꣁ
गा॑रुचैना॑
ꢂꢪ꣄ꢜꢶ / ꢔꣁꢙ꣄ꢙꢸ
अम्टि / गा॑ज्जु
ꢒꢸꢜ꣄ꢒꢶꢬꢶ / ꢂꢪ꣄ꢨꢜ꣄
कुट्किरि / अम्बट
ꢂꢪ꣄ꢨꢶꢭ꣄
अम्बिल्
ꢒꢿꢱꢬꢶ
केसरि
ꢒꢥ꣄ꢣꢸꢭꣁ
कन्दुला॑
ꢪꢥ꣄ꢣꣁ
मन्दा॑
ꢗꢜ꣄ꢥꢶ
चट्नि
ꢡꢒ꣄ꢒꢵꢳꢶ ꢗꢜ꣄ꢥꢶ
तक्कालि चट्नि
ꢥꢬꢳ꣄꣄ ꢗꢜ꣄ꢥꢶ
नरळ् चट्नि
ꢦꢸꢡꢶꢥꢵ ꢗꢜ꣄ꢥꢶ
पुतिनाचट्नि
ꢪꢭ꣄ꢭꢶ ꢗꢜ꣄ꢥꢶ
मल्लि चट्नि
ꢱꢸꢒ꣄ꢒꢜ꣄
सुक्कट्
ꢗꢦ꣄ꢦꢵꢡ꣄ꢡꢶ
चप्पात्ति
ꢩꢵꢡ꣄
भात्
ꢩꢵꢡ꣄ / ꢂꢥ꣄ꢥꢸ
भात् / अन्नु
ꢱꢪ꣄ꢨꢵꢬ꣄
सम्बार्
ꢱꢾꢬꣁ
स॑रा॑
ꢬꢾꢱ꣄ꢱꢸ
र॑स्सु
ꢥꢴꢥ꣄ꢓꢥꢶ
न्हन्खनि
ꢒꢗ꣄ꢗꢾꢥ꣄ꢥꣁ
कच॑न्ना॑
ꢱꢸꢒꢸꢠ꣄ꢜꣁ
सुकुण्टा॑
ꢭꢶꢪ꣄ꢨꢸ ꢩꢵꢡ꣄
लिम्बु भात्
ꢗꢾꢡ꣄ꢡꢶ ꢩꢵꢡ꣄
चेत्ति भात्
ꢦꣁꢥ꣄ꢥꢶꢥ꣄ ꢗꣁꢥ꣄ꢥꣁ ꢩꢵꢡ꣄
पोन्निन्चोन्नोभात्
ꢭꢶꢪ꣄ꢦꢸꢩꢵꢡ꣄
लिम्पुभात्
ꢤꢶꢟꣁ
धिढो
ꢚꣁꢳ꣄ꢳꢵ ꢩꢵꢡ꣄
झोळ्ळा भात्
ꢤꢾꢄ~
ध॑इ~
ꢗꣁꢬꣁ
चा॑रा॑
ꢭꣁꢱ꣄ꢜꣁ
ला॑ष्टा॑
ꢡꢷ꣄ꢳ꣄ ꢭꣁꢰ꣄ꢜꣁ / ꢡꢷꢳ ꣄꣄ꢣꢵꢳ꣄
तीळ्ला॑ष्टा॑ तीळ्दाळ
ꢒꢸꢳꢶꢶꢡ꣄ ꢣꢵꢳ꣄
कुळित्दाळ
ꢥꢬꢳ꣄꣄ ꢣꢵꢳ꣄
नरळ्दाळ
ꢨꢾꢳꢵꢣꢵꢳ꣄
बेलादाळ
ꢦꢸꢡꢶꢥꢵ ꢣꢵꢳ꣄
पुतिनादाळ
ꢥꢬꢳ꣄꣄ ꢣꢹꢡ꣄
नरळ्दूत्
ꢪꣀ / ꢪꢤꢸ / ꢡꢿꢥꢾ
मै / मधु / तेन॑
ꢡꢾꢥ꣄ꢡꢸꢭꣁ
त॑न्दुला॑
ꢜꢷ ꢦꢵꢥ꣄
ती पान
ꢤꢶꢞꣁ
धिडा॑
ꢜꢷ
टी
ꢡꢹꢦ꣄
तूप्
ꢲꣁꢭ꣄ꢭꢵ ꢓꢥꢶ
होल्ला खनि
ꢦꢒ꣄ꢒꣂꢜꣁ
पक्कोटा
ꢂꢦ꣄ꢦꢭꢪ꣄
अप्पलम्
ꢦꣁꢳ꣄ꢳꢵ ꢬꢾꢱ꣄ꢱꢸ
पा॑ळ्ळा र॑स्सु
ꢱꢶꢳ꣄ꢳ ꢩꢵꢡ꣄
सिळ्ळ भात्
ꢒꣁꢞꢸꢒ꣄
का॑डुक
ꢩꢙ꣄ꢙꢶ
भज्जि
ꢦꢵꢮ꣄
पाव्
ꢦꢱꢪ꣄
पसम्
ꢣꢹꢡ꣄
दूत्
ꢣꢹꢡ꣄ꢩꢿꢞꢵ ꢦꢵꢭ꣄ꢒꣁꢮꢵ
दूत्भेडा / पल्का॑वा
ꢱꢵꢫ꣄
साय्
ꢦꢶꢜ꣄ꢜꢸ
पिट्टु
ꢨꣁꢱꢸꢭꢵ ꢩꢵꢡ꣄
बा॑सुला भात्
ꢱꢷꢱꢸ ꢂꢮ꣄ꢠ꣄ꢞꢶ
सीसु अव्ण्टि
ꢣꢄ~ ꢬꢫ꣄ꢡꣁ
द॑इ~ रय्ता॑
ꢂꢪ꣄ꢦꢜ꣄ ꢩꢵꢡ꣄
अम्पट्भात्
ꢦꢹꢥ꣄ꢡꢶ
बून्ति
ꢦꣁꢖ꣄ꢒꢭ꣄
पा॑ङकल्
ꢔꢸꢳ꣄ꢳꢾ ꢦꣁꢖ꣄ꢔ꣄ꢭ꣄
गुळ्ळ॑ पा॑ङगल्
ꢪꢸꢣ꣄ꢣꢵ ꢦꣁꢖ꣄ꢔ꣄ꢭ꣄
मुद्दा पा॑ङगल्
ꢒꢾꢬꢭ꣄
प॑रल्
ꢔꢸꢳ꣄ꢳꢾ ꢦꢾꢬꢵꢭ꣄
गुळ्ळ॑ प॑राल्
ꢒꢫ꣄ꢭꣁ ꢒꢾꢱꢸꢬ꣄ / ꢦꣁꢳ꣄꣄ꢜꢶꢥꢶ / ꢦꣁꢳ꣄꣄ꢜꢾ ꢗꢥꣁ
कय्ल केसुर्पोळ्टिनि / पोळ्ट॑ चैनो
ꢦꢾꢬꢵꢭ꣄ ꢆꢠ꣄ꢜꢾ
पेराल् उण्टा॑
ꢦꣂꢠ꣄ꢜꢵ
पोण्टा
ꢨꣂꢳꢶ
बोळि
ꢗꣀꢥꣁ / ꢪꢵꢪ꣄ꢱꢸ
चैना॑ / माम्सु
ꢦꢷꢜ꣄
पीट्
ꢪꢬ꣄ꢒꢫ꣄ꢭꢵ ꢨꢸꢬ꣄ꢒꣁ
मर्कय्ला बुर्का॑
ꢪꢴꢳꢶ ꢂꢪ꣄ꢜꢶ
म्हळि अम्टि
ꢂꢠ꣄ꢜꢵ ꢂꢪ꣄ꢜꢶ
अण्डा अम्टि
ꢂꢠ꣄ꢞꢵ ꢤꢶꢞꣁ
अण्डा धिडा॑
ꢗꢫ꣄ꢭꢶ / ꢡꢾꢥ꣄ꢡꢸꢭꣁ
चय्लि / त॑न्दुला॑
ꢂꢗ꣄ꢗꢸ ꢡꢾꢥ꣄ꢡꢸꢭꣁ
अच्चु त॑न्दुला॑
ꢲꢵꢡꢸ ꢡꢾꢥ꣄ꢡꢸꢭꣁ
हातु त॑न्दुला॑

Script - Fruits

ꢦꣁꢳ꣄ꢳꢵꢥ꣄
पा॑ळ्ळान्
ꢆꢦ꣄ꢨꢸवꣁ
उम्बुळा॑
ꢧꣁꢥ꣄ꢥꢶꢱꢸ ꢦꣁ꣄ꢳ꣄ꢳꣁ
फ॑न्निसुपा॑ळ्ळा॑
ꢚꢵꢞꢸꢦꣁꢳ꣄ꢳꣁ
झाडुपा॑ळ्ळा॑
ꢃꢦ꣄ꢦꢳ꣄
आप्पिळ
ꢃꢬꢛ꣄ꢙꢶ
आरञ्जि
ꢨꣂꢬꢸ ꢦꣁꢳ꣄ꢳꣁ
बा॑रुपा॑ळ्ळा॑
ꢦꢾꢬ꣄ꢗ꣄ꢗꢪ꣄ꢦꣁꢳ꣄ꢳꣁ
प॑र्च्चर्पा॑ळ्ळा॑
ꢒꢫ꣄ꢭꣁ
कय्ला॑
ꢗꢶꢦ꣄ꢦꣁ
चिप्पा॑
ꢒꣁꢜ꣄ꢜꢾ
का॑ट्ट॑
ꢄꢪ꣄ꢨꢸꢳꣁ
इम्बुळा॑
ꢗꢦ꣄ꢦꣂꢜ꣄ꢜꢵ
चप्प्पा॑ट्टा
ꢱꢷꢡꢵ ꢦꣁꢳ꣄ꢳꣁ
सीतापा॑ळ्ळा॑
ꢒꢷꢡ꣄
कीत
ꢡꢒ꣄ꢒꢵꢳꢶ
तक्काळि
ꢣꢬ꣄ꢨꢹꢱ꣄
दर्बूस्
ꢡꢶꢬꢵꢒ꣄ꢰꣁ
तिराक्ष
ꢡꣁꢮ꣄ꢞꣁ
ता॑व्टा॑
ꢣꣁꢬꢶ / ꢥꢵꢬꣁ
दा॑रि / नारा॑
ꢮꢷꢜ꣄
वीट्
ꢙꢾꢪ꣄ꢨꢸ ꢦꣁꢳ꣄ꢳꣁ
ज॑म्बुपा॑ळ्ळा॑
ꢱꢸꢒ꣄ꢒꢾꢥꢬꢳ꣄
सुक्क॑ नरळ
ꢥꢿꢥ꣄ꢣꢶꢬꢪ꣄ ꢒꢾꢳꣁ
नेन्दिरम्क॑ळा॑
ꢦꢦ꣄ꢦꢵꢳꢶ
पप्पाळि
ꢦꣁꢳ꣄ꢳꣁ / ꢦꢳ꣄ꢳꣁ
पा॑ळ्ळा॑ / पल्ला॑
ꢡꢵꢞꢶ ꢦꣁꢳ꣄ꢳꣁ
ताडिपोळ्ळा॑
ꢦꢶꢥ꣄ꢣ ꢦꣁꢪ꣄ꢨꢸꢳ ꢦꣁꢳ꣄ꢳꣁ
पिन्द पा॑म्बुळ पाळ्ळा॑
ꢩꢿꢬꢶꢒꢫ꣄ꢭꣁ
भेरिकय्लो
ꢒꢗ꣄ꢗꢪ꣄ꢨꣁ
कच्चम्बा॑
ꢣꢜꢶꢪ꣄ꢦꣁꢳ꣄ꢳꣁ
दटिम्पा॑ळ्ळा॑
ꢒꢗ꣄ꢗꢪ꣄ꢨꢵ ꢨꣁꢳ꣄ꢳꣁ
कच्चम्बा पा॑ळ्ळा॑
ꢪꢸꢥ꣄ꢡꢶꢬꢶ
मुन्तिरि
ꢪꢸꢥ꣄ꢡꢶꢬꢶꢒ꣄ ꢒꣁꢜ꣄ꢜꢾ
मुन्तिरि का॑ट्ट॑
ꢒꢾꢳꣁ
क॑ळा॑
ꢨꢷꢒ꣄ / ꢮꢶꢡ꣄ꢡꢸ
बीक / वित्तु
ꢨꢷꢙ꣄
पीज्
ꢮꢳ꣄ꢒꢵ ꢦꣁꢳ꣄ꢳꣁ
वळ्का पा॑ळ्ळा॑

Script - Games

ꢓꢾꢳꢸꢸꢥ꣄ ꢒꢶꢥꢸ ꢓꢾꢳꢸ ꢱ꣄ꢩꢬ꣄ꢤꢵꢥ꣄
खेळुन किनु खेळु स्भर्धान
ꢙꢾꢡꣁ / ꢔꢸꢪ꣄ꢦꢸ
ज॑ता॑ / गुम्पु
ꢓꢵꢳ꣄ / ꢓꢾꢳ꣄
खाळ / खेळ
ꢨꢾꢠ꣄ꢜꢸ ꢮꢵꢕ꣄ ꢓꢭ꣄ꢥꢶ
ब॑ण्टु वाघ् खळ्नि
ꢩꢭ ꢮꢶꢱꢶꢬ꣄ꢥꢶ
भल विसिर्नि
ꢣꢿꢲꢵꢦ꣄ꢧꢶꢫꢵꢱ꣄
देहाभ्यास्
ꢇꢛ꣄ꢗꢭꢶ / ꢲꢷꢥ꣄ꢡꢳꣁ
ऊञ्चलि / हिन्तळा॑
ꢦ꣄ꢬꢡꢶꢮꢵꢥ꣄
प्रतिवान्
ꢤꢪ꣄ꢥꢶꢓꢾꢭ꣄
धम्निखेल्
ꢤꢪ꣄ꢤꢾꢬꢥ꣄ ꢓꢵꢳ꣄꣄ / ꢡꢾꢬꢡ꣄ꢡꢾꢓꢵꢳ꣄
धाम्ध॑रन्खाळ / तेरत्तेखाल्
ꢒꢜ꣄ꢗꢶ
कट्चि
ꢒꢦꢞꢶ
कपडि
ꢦꢵꢄ~ ꢔꣁꢳꣁ
पाइ~गा॑ळा॑
ꢒꢶꢜ꣄ꢜꢶꢦꢸꢳ꣄꣄ / ꢓꢜ꣄ꢜꢶ ꢓꢵꢳ꣄
किट्टिपुळ / खट्टिखाळ
ꢦꢵꢠ꣄ꢞꢶ ꢓꢵꢳ꣄
पाण्डि खाल्
ꢬꢮꢵꢒ꣄ ꢓꢵꢳ꣄꣄
रवा खाळ
ꢩꢙ꣄ꢙꢶ
भज्जि
ꢧꣁꢳ꣄꣄ꢜꢾ ꢩꢙ꣄ꢙꢶ
पा॑ळ्ट॑ भज्जि
ꢒꢞꢭꢾ
कडल॑
ꢱꢶꢮ꣄ꢙꢾ ꢒꢞꢭꢾ
सिव्ज॑कडल॑
ꢔꣁꢳ ꢩꢵꢬ꣄ ꢮꢶꢱꢶꢬ꣄ꢥꢶ / ꢔꢸꢠ꣄ꢜꢸ ꢮꢶꢱꢶꢬ꣄ꢥꢶ
गा॑ळ भार्विसिर्नि / गुण्डु विसिर्नि
ꢔꢸꢣ꣄ꢣꢶꢥꢶ ꢚꢾꢞꣁ / ꢔꢸꢣ꣄ꢣꢵ ꢚꢾꢞꣁ
गुद्दिनि झ॑डा॑ / गुद्दा झ॑डा॑
ꢒꢸꢱ꣄ꢡꢶ
कुस्ति
ꢒꢦ꣄ꢦꢸ
कप्पु
ꢨꢳꢶꢖ꣄ꢔꢶ
बळिङगि
ꢒꢨꢞꢶ
कबडि
ꢗꢣꢸꢬꢖ꣄ꢒꢪ꣄
चदुरङकम्
ꢗꢷꢞꢸꢓꢵꢳ꣄
चीडुखाळ
ꢗꢷꢜ꣄
चीट्
ꢭꢮ꣄ꢥꢶꢱ꣄ ꢦꢬ꣄ꢤꢥ꣄
लव्निस्पर्धन्
ꢔꣁꢳꢶ
गा॑ळी
ꢒꣁꢮ꣄ꢜꢵ ꢓꢵꢳ꣄
कोव्टाखाळ
ꢏꢜ꣄ꢥꢶ / ꢦꢬꢵꢙꢾꢫꣁ
ओट्नि / पराजेयो
ꢡꢬ꣄ꢥꢶ / ꢅꢡꣁ
तर्नि / ईया॑
ꢮꢾꢣꢸꢬꢸ ꢮꢬ꣄ꢠꢥꣁ / ꢦ꣄ꢬꢡ꣄ꢫꢒꢰ ꢮꢬ꣄ꢠꢥꣁ / ꢡꢡ꣄ꢒꢵꢭꢸ ꢮꢬ꣄ꢠꢥꣁ
व॑दुरु वर्णना॑ / प्रत्यक्ष वर्णना॑ / तत्कालु वर्णना॑
ꢮꢺꢡꢸ
वृतु
ꢦꣁꢜ꣄ꢜꢪ꣄
पा॑ट्टम्
ꢥꣃꢒꢵꢱ꣄ꢦꢬ꣄ꢤꢥꣁ / ꢥꣃꢒꢵ ꢦꣁꢥ꣄ꢡꢶ
नौका स्पर्धना॑ / नौका पा॑न्ति
ꢱ꣄ꢦꢬ꣄ꢤꢥ꣄ / ꢦꣁꢥ꣄ꢡꢶ
स्पर्धन / पा॑न्ति
ꢦꢥ꣄ꢡꢸ / ꢔꣁꢳꣁ
पन्दु / का॑ळा॑
ꢩꣁꢖ꣄ꢒꢸꢬꣁ
भा॑ङकुरा॑
ꢩꣁꢔꢸꢪꢵꢥ꣄ / ꢙꢿꢪ꣄
भा॑गुमान / जेम
ꣁꢦꢭ꣄ꢭꢵꢖ꣄ꢒꢸꢳꢶ
पल्लाङकुळि
ꢱꢖ꣄ꢓ꣄ꢫꢵꢥ꣄
सङख्यान
ꢧꢹꢭꢸ ꢔꣁꢳꣁ / ꢧꢹꢭꢸ ꢦꢥ꣄ꢣꢸ
फुलु गा॑ळा॑ / फुलु पन्दु
ꢱ꣄ꢦꢬ꣄ꢤꢵ ꢡꣁꢬꢠ꣄
स्पर्धा ता॑रण
ꢏꢭꣁ / ꢙꢵꢭ꣄
आ॓ला॑ / जाल
ꢓꢿꢳꢸ ꢬꢾꢪ꣄
खेळु रेम्
ꢓꢿꢳ꣄
खेळ
ꢓꢿꢳꢸꢮꢥ꣄ / ꢢꢷꢬ꣄
खेळुवन / थीर
ꢓꢿꢳꢸꢮꢡꢶ / ꢓꢿꢳ꣄ꢳꢶꢶ
खेळुवति / खेळळि
ꢙꢷꢒ꣄ / ꢙꢾꢫꢪ꣄
जीक् / ज॑यम

Script - Grammar

ꢮ꣄ꢫꢸꢃꢒꢬꢠ꣄
व्याकरण
ꢂꢒ꣄ꢰꢬ꣄
अक्षर्
ꢂꢒ꣄ꢰꢵꢥ꣄ꢡꢬ꣄
अक्षान्तर्
ꢮꢶꢯꢿꢰꢠꣁ ꢔꢸꢠꢶ
विसेषणा॑ / गुणि
ꢡꢵꢭꢸ ꢱꢨ꣄ꢣꢸ / ꢲꢬꢶꢞꢶ ꢱꢨ꣄ꢣꢸ
तालुसब्दु / हरडिसब्दु
ꢬꢹꢦꢮꢬ꣄ꢠꢶ / ꢂꢭꢖ꣄ꢒꢵꢬ꣄
रूपवर्णि / अलङकार्
ꢬꢹꢦꢸ ꢥꢶꢬ꣄ꢪꢵꢥ꣄
रूपु निर्मान्
ꢩꢖ꣄ꢔꢶ ꢩꢵꢰꢥ꣄ / ꢦꢬꣂꢰ ꢩꢵꢰꢠ꣄
बङगिभाषन् / परोक्षभाषण्
ꢂꢬ꣄ꢤ ꢨꢶꢥ꣄ꢣꢸ
अरध बिन्दु
ꢂꢬꢹꢦ ꢥꢵꢮ꣄
अरूप नाव्
ꢥꢦꢸꢪ꣄ꢱꢒ ꢭꢶꢖ꣄ꢔꢸ / ꢂꢳ꣄ꢳꢶꢖ꣄ꢔꢸ
नपुम्सक लिङ्गु / अळ्ळिङ्गु
ꢯꢨ꣄ꢣ ꢂꢮ꣄ꢥꢶ
शब्द अवनि
ꢦꢸꢪ꣄ꢱꢒꢭꢶꢖ꣄ / ꢣꢭ꣄ꢭꢶꢖ꣄ꢔ꣄
पुम्सकलिङ / दल्लिङगु
ꢃꢡ꣄ꢪꢷꢫꢮꢶꢩꢒ꣄ꢡꢶ / ꢱꣁꢮ꣄ꢮꢾ ꢮꢶꢩꢒ꣄ꢡ
आत्मीय विभक्ति / सा॑व्व॑ विभक्त
ꢦꢸꢬꢸꢱ
पुरुष
ꢱꢡ꣄ꢮ ꢮꢶꢩꢒ꣄ꢡꢶ
सत्व विभक्ति
ꢪꢳ꣄ꢥꢶ ꢱꢨ꣄ꢣꢸ
मिळ्नि सब्दु
ꢙꣁꢞꢶ
जा॑डि
ꢦ꣄ꢬꢒꢺꢡꢶ
प्रकृति
ꢕꢵꢪ꣄ ꢮꢡ꣄ꢡꣁ ꢣꢿꢱꢶ ꢮꢡ꣄ꢡꣁ
घाम्वत्ता॑ / देसि वत्ता॑
ꢡꣂꢣꢸ ꢗꢾꢬ꣄ꢥꢶ
तोदुच॑र्नि
ꢣꢶꢮ꣄ꢥ ꢶꢱꢖ꣄ꢓ꣄꣄ꢫꣁ
दिव्नि सङख्या॑
ꢣꢶꢮ ꢮꢶꢩꢒ꣄ꢡꢶ
दिव विभक्ति
ꢣꢶꢮ꣄ꢥꢶ
दिव्नि
ꢮ꣄ꢫꢵꢒꢬꢠ ꢩꢵꢒꢥ꣄꣄
व्याकरण भागुन
ꢮ꣄ꢫꢵ ꢒꢬꢠ ꢭꢶꢖꢔꢸ
व्याकरण लिङगु
ꢮ꣄ꢫꢵꢒꢬꢠ꣄
व्याकरण
ꢮ꣄ꢫꢵꢒꢬꢠ ꢱꢪ꣄ꢦ꣄ꢬꢣꢵꢫ꣄
व्याकरण सम्प्रदाय
ꢮ꣄ꢫꢵꢒꢬꢠ ꢱꢵꢱꢥꣁ
व्याकरण सासना॑
ꢙꢶꢫꢾ ꢒꢵꢭ꣄ / ꢔꢿ ꢒꢵꢭ꣄
जिय॑ काल / गे काल
ꢆꢗ꣄ꢗꢵꢬꢠ꣄
उच्चारण
ꢚꢶꢬ꣄ꢒꢶꢥꢶ
झिर्किनि
ꢏꢣꢜ꣄ / ꢲꣂꢜ꣄
आ॓दट् / होट
ꢂꢡꢶꢱꢵꢫꣂꢡ꣄ꢡꢶ / ꢂꢡꢶꢮꢬ꣄ꢠꢥꣁ
अतिसायोत्तो / अति वर्णना॑
ꢦꢹꢙ꣄ꢫ ꢦꢲꢸ ꢮꢗꢥ꣄ / ꢪꢿꢜꢸ ꢨꢲꢸ ꢮꢗꢥ꣄
पुज्य पहु वचन् मेटु बहु वचन
ꢱ꣄ꢮꢬꢵꢒ꣄ꢰꢬ꣄ ꢂꢙꢸꢥꢒ꣄ꢰꢬ꣄
स्वराक्षर अजुनक्षर्
ꢱꢙꢷꢮꢶ
सजीवि
ꢮꢶꢩꢒ꣄ꢡꢶ ꢗꢶꢥ꣄ꢲꢸꢥ꣄ ꢮꢶꢩꢡꢒ꣄ꢡꢶ ꢮꢬ꣄ꢠꢒꢸꢥ꣄
विभक्ति चिन्हुन विभक्ति वर्णकुन
ꢩꢵꢱ꣄ꢫꣁ
भष्या॑
ꢆꢦꢪꣁ
उपमा॑
ꢂꢥ꣄ꢡ ꢥꢶꢬ꣄ꢪꢵꢥ꣄
अन्तर्निमान्
ꢪꢴꢣ꣄ꢣꢶ ꢢꣁꢮ꣄ꢥꢶ
म्हद्दि था॑व्नि
ꢇꢲꢪ꣄
ऊहम्
ꢱꢖ꣄ꢓ꣄ꢫꣁ
सङख्या॑
ꢂꢮꢥ꣄ꢒꢵꢭ꣄
अवन्काल्
ꢮ꣄ꢫꢡꢶꢬꢿꢒ ꢱꢨ꣄ꢣꢸ
व्यतिरेक सब्दु
ꢮ꣄ꢫꢡꢶꢬꢿꢒ꣄
व्यतिरेक
ꢂꢰꢬ꣄ / ꢭꢶꢦꢶ
अक्षर् / लिपि
ꢒꢬ꣄ꢡꣁ
कर्ता॑
ꢃꢙ꣄ꢛꢵ
आज्ना॑
ꢗꢾꢬꢶꢨꢥ꣄ꢤꢶ
च॑रिबन्धि
ꢌꢒꢮꢗꢥ꣄
एकवचन
ꢱ꣄ꢮꢬꣁ / ꢤ꣄ꢮꢥꢶ
स्वरा॑ / ध्वनि
ꢆꢗ꣄ꢗꢵꢜꢥꢪ꣄
उच्चाटनम्
ꢬꢷꢠꢸ ꢮꢡ꣄ꢡꣁ / ꢩꢬꢳ ꢮꢡ꣄ꢡꣁ
रीणुवत्ता॑ / भरळ वत्ता॑
ꢓꢳ꣄ꢳꢥ꣄ ꢮꢡ꣄ꢡꣁ
खळ्ळन वत्ता॑
ꢒꢭꢸ
कालु
ꢱ꣄ꢮꢭ꣄ꢦ ꢮꢶꢬꢵꢪ / ꢥꢴꢥ꣄ ꢕꢾꢞꢶ
स्वल्प विराम / न्हन्घ॑डि
ꢔꢸꢬꢶ / ꢗꢶꢥ꣄ꢲꢸ
गुरि / चिन्हु
ꢡꢵꢳꢸ / ꢭꢫꣁ
ताळु / लया॑
ꢱꢥ꣄ꢤꢶ
सन्धि
ꢱꢪ꣄ꢱꢬ꣄ꢔꢸ
सम्सर्गु
ꢔꢸꢬꢶ
गुरि
ꢱꢹꢡ꣄ꢬꢸ
सूत्रु
ꢩꢵꢮ ꢩꢵꢰꣁ
भाव भाषा॑
ꢯꢨ꣄ꢣꢸ
शब्दु
ꢯꢨ꣄ꢣ ꢮ꣄ꢫꢵꢒꢬꢠꣁ
सब्द व्याकरणा॑
ꢪꢥ꣄ꢡꢸ / ꢗꢹꢒ꣄
मन्तु / चूक्
ꢧꣀꢭ꣄ ꢦꢸꢬꢸꢱꢸ
फैल पुरुशु
ꢂꢒꢬ꣄ꢪꢒ ꢒ꣄ꢬꢶꢫꣁ
अकर्मक क्रिया॑
ꢱꢒꢬ꣄ꢪꢒ ꢒ꣄ꢬꢶꢫꣁ
सकर्मक क्रिया॑
ꢱꢵꢤꢵꢬꢠ ꢮꢵꢒ꣄ꢫꣁ
साधारण वाक्या॑
ꢩꢵꢰꢠ ꢮꢡ꣄ꢡꣁ
भाषण वत्ता॑
ꢔꢸꢪ꣄ꢦꢸꢥꢵꢮ꣄
गुम्पु नाव्
ꢪꢥ꣄ꢡꢸ ꢮꢡ꣄ꢡꣁ
मन्तु वत्ता॑
ꢆꢦ ꢒ꣄ꢬꢶꢫꣁ
उप क्रिया॑
ꢮꢾꢒ꣄ꢒꢶꢥꢶ
वेक्किनि
ꢱꢪ꣄ꢫꢸꢒ꣄ꢡꢸ
सम्युक्तु
ꢆꢒ꣄ꢡꢶ ꢮꢵꢒ꣄ꢫꢪ꣄ / ꢮꢡ꣄ꢡꢵ ꢡꣁꢬꢠ꣄
उक्तिवाक्यम / वत्ता तोरण
ꢥꢶꢬꢥ꣄ꢡꢬ ꢒꢵꢭ꣄
निर्न्तर काल्
ꢮꢵꢒ꣄ꢫ ꢦ꣄ꢬꢒꢬꢠꣁ
वाक्य प्रकरणा॑
ꢒꢬ꣄ꢪꢸ ꢥꢵꢮ꣄
कर्मु नाव्
ꢬꢷꢡꢶ
रीति
ꢗꢬ꣄ꢮ ꢮꢶꢩꢒ꣄ꢡꢶ
चर्व विभक्ति
ꢗꢭ꣄ꢡ ꢒꢵꢭ꣄
चल्त काल्
ꢮꢶꢬꢵꢪꢸ ꢗꢶꢥ꣄ꢲꢸ
विरामु चिन्हु
ꢭꢵꢪ꣄ꢱ꣄ꢮꢬꣁ
लाम्स्वरा॑
ꢂꢒ꣄ꢰꢬꢵꢥ꣄
अक्षरान्
ꢦ꣄ꢬꢡꢶꢩꢵꢱꢥ꣄
प्रतिभाषन्
ꢤꢹꢬ꣄ ꢦꢸꢬꢸꢱꢸ
दूर्पुरुसु
ꢮꢵꢒ꣄ꢮꢶꢲꢵꢬ꣄
वाक्विहार्
ꢒ꣄ꢬꢶꢫꢵꢦꢣ꣄
क्रियापद
ꢨꢲꢹ ꢮꢗꢥ꣄
बहु वचन्
ꢔꢷꢡ꣄
गीत्
ꢭꢶꢖ꣄ꢔꢸ
लिङगु
ꢪꢥ꣄ꢡꢸ
मन्तु
ꢱꢒꢬ꣄ꢪꢒ ꢒ꣄ꢬꢶꢫꣁ
सकर्मक क्रिया॑
ꢂꢥꢸꢨꢥ꣄ꢤꢸ
अनुबन्धु
ꢦꢹꢬ꣄ꢠ ꢮꢶꢬꢵꢪ꣄
पूर्ण विराम
ꢲꣁꢭ꣄ꢭꢵ ꢥꢶꢬ꣄ꢪꢵꢥ꣄
हा॑ल्ला निर्मान्
ꢱ꣄ꢡ꣄ꢬꢷ ꢭꢶꢖ꣄ꢔꢸ / ꢂꢳ꣄ꢳꢶꢖ꣄ꢔꢸ
स्त्री लिङ्गु / अळ्ळिङ्गु
ꢱꢬ꣄ꢮ ꢥꢵꢮ꣄ / ꢦ꣄ꢬꢡꢶ ꢥꢵꢮ꣄
सर्व नाव / प्रति नाव
ꢮꢶꢯꢿꢰꢠ꣄
विशेषण
ꢱꢵꢤꢵꢬꢠꢭꢶꢖ꣄ꢔꢸ
साधारणलिङ्गु
ꢱꢵꢤꢵꢬꢠ ꢱꢨ꣄ꢣꢸ
साधारण सब्दु
ꢂꢬ꣄ꢢꢸ
अर्थु
ꢮꢒ꣄ꢬꣂꢒ꣄ꢡꢶ / ꢱꢪ꣄ꢡꢿꢲꢵꢬ꣄ꢢꢸ
वक्रोक्ति / सन्देहार्थु
ꢱꢪ꣄ꢦꢶꢬꢣꢵꢫꢸ / ꢬꢹꢟꢶ
सम्पिरदायु / रूढि
ꢮ꣄ꢫꢒ꣄ꢡ ꢮꢡ꣄ꢡꣁ
व्यक्त वता॑
ꢮ꣄ꢫꢒ꣄ꢡ ꢱ꣄ꢮꢬꣁ
व्यक्त स्वरो
ꢂꢬ꣄ꢤ ꢨꢶꢥ꣄ꢤꢸ
अर्ध बिन्धु
ꢪꢸꢱꢸꢥꢵ ꢒ꣄ꢬꢶꢫꣁ
मुसुना क्रिया॑
ꢦꢣꢪ꣄ / ꢂꢣꢶꢒꢬꢠꢪ꣄
पदम् / अदिकरणम्
ꢥꢶꢱ꣄ꢱꢥ꣄ꢣꢾꢲ ꢒ꣄ꢬꢶꢫꣁ / ꢦꢹꢬ꣄ꢠ ꢒ꣄ꢬꢶꢫꣁ
निस्सन्देह क्रिया॑ / पूर्ण क्रिया॑
ꢮꢾꢣꢸꢬ꣄ꢦꢸꢬꢸꢱꢸ / ꢣꢶꢮꢦꢸꢬꢸꢰꢸ
वेदुर्पुरुषु / दिवपुरुषु
ꢂꢔ꣄ꢬ ꢨꢥ꣄ꢡꢸ
अग्र बन्धु
ꢥꢵꢒꢸ ꢱꢾꢣ꣄ꢣꢸ
नाकु स॑द्दु
ꢲꢒꢵꢬ ꢯꢨ꣄ꢣꢸ / ꢱ꣄ꢮꢵꢱꢪ꣄ / ꢪꢲꢵ ꢦ꣄ꢬꢵꢠꢪ꣄
हकार शब्दु / स्वासम् / महाप्राणम्
ꢲꢭꢸꢥ꣄
हलुन्
ꢲꢾꢞꢶ ꢱꢖ꣄ꢒꢶꢥꢶ
ह॑डि सङकिनि
ꢘꢥ꣄ꢡꢱ꣄
छन्तस्
ꢮꢵꢒ꣄ꢫ ꢩꢵꢔ꣄
वाक्य भाग
ꢮꢶꢤꢶ
विधि
ꢦ꣄ꢬꢱ꣄ꢠꣁ
प्रस्नो
ꢦ꣄ꢬꢱ꣄ꢠ ꢔꢸꢬꢶ
प्रष्ण गुरि
ꢒ꣄ꢬꢶꢫꢵꢦꢣꢸ
क्रियापदु
ꢒ꣄ꢬꢶꢫꢵꢮꢶꢱꢾꢰꢠ꣄ / ꢂꢮ꣄ꢫꢫꣁ
क्रिया विसेषण / अव्यया॑
ꢮꢶꢩꢒ꣄ꢡꢶ
विभक्ति

Script - Health

ꢃꢬꣁꢔ꣄ꢫꣁ ꢒꢶꢥꢸ ꢬꣂꢔꢸꢥ꣄ ꢲꣁꢔꢡꢸꢥ꣄
आरोग्या॑ किनु रोगुन हा॑गतुन
ꢂꢪ꣄ꢪꣁ
अम्मा॑
ꢓꢮ꣄ꢙꢵꢮ꣄ / ꢓꢵꢱ꣄
खव्जाव / खास
ꢗꢶꢥꢲꢸ
चिनहु
ꢧꢜꢶꢥꢶ
फटिनि
ꢂꢙꢷꢬ꣄ꢥꢸ
अजीर्णु
ꢱꣃꢒ꣄ꢫꢪ꣄
सौक्यम्
ꢂꢱ꣄ꢦꢡ꣄ꢡꢶꢬꢶ / ꢃꢱꢸ ꢩꢣ꣄ꢬꢶ
अस्पत्तिरि / आसु भद्रि
ꢓꣁꢮ꣄ꢭꣁ
खा॑व्ला॑
ꢱꢮ꣄ꢬꢶꢫꢪ꣄
सव्रियम्
ꢒꢾꢠ꣄ꢜꢵꢦꢷꢭ꣄ / ꢄꢥ꣄ꢒꢶꢥꢶ
क॑ण्टापील् / इन्किनि
ꢓꢵꢱ꣄ / ꢩꢸꢬꢸꢩꢸꢬꢵꢭ꣄
खास् / भुरुभुराल
ꢦꢬꢸꢒꢾꢬ꣄ꢥꢶ
परुक॑र्नि
ꢙꢵꢳ꣄
जाळ
ꢲꢜ꣄ꢒꣁ ꢪꢸꢞꢶꢥꢶ
हट्का॑ मुडिनि
ꢲꣁꢥꢵꢱ꣄ꢡꢾ / ꢗꢾꢬ꣄ꢥꢵꢱ꣄ꢡꢾ / ꢤꢾꢬ꣄ꢥꢵꢱ꣄ꢡꢾ
होनास्ते / च॑र्नास्ते / ध॑र्नास्ते
ꢮꢪꢶ / ꢏꢔꢬꢶ / ꢮꢵꢥ꣄ꢣꢶ
वमि / आ॑गरि / वान्दि
ꢬꢾꢔꢡ꣄ ꢔꢾꢳ꣄꣄ꢥꢶ
र॑गत ग॑ळ्नि
ꢣꣁꢳꢵ ꢣꢸꢮ꣄ꢥꣁ
दोळा दुव्नो
ꢔꢾꢬꢳ꣄
गेरळ
ꢔꢬ꣄ꢩꢸ ꢲꢵꢥꢶ
गर्भु हानि
ꢔꢬ꣄ꢩꢸ ꢥꢶꢬꣁꢣ꣄
गर्भु निरोद
ꢭꢮꢥ꣄ ꢲꣁꢔꢡ꣄
लवन हा॑गत्
ꢱꢷꢥ꣄
सीन्
ꢲꢜ꣄ꢒꣂ ꢡꢶꢙꢫ꣄ꢥꢶ
हट्का॑ तिजय्नि
ꢒꢵꢥꢸ꣄ ꢣꢸꢮ꣄ꢥꣁ
कानु दुव्ना॑
ꢒꢪꢵꢭ꣄
कमाल्
ꢃꢖ꣄ꢔꢸ ꢲꢸꢥ꣄ꢥꣁ / ꢡꢵꢦ꣄
आङगु हुन्ना॑ / ताप
ꢦꢵꢄ~ ꢃꢠꢶ
पाइ~ आणि
ꢒꢺꢪꢶ ꢥꢵꢱꢶꢥꢶ
कृमि नासिनि
ꢦꢶꢱꣁ
पिसा॑
ꢂꢥ꣄ꢡ꣄ꢬꢵꢪꢸ ꢓꢙ꣄ꢙꢸ
अन्त्रामु खज्जु
ꢮꢵꢪꢶ / ꢏꢔꢬꢶ
वामि / आ॑गरि
ꢔꣁꢳꢶ
गा॑ळि
ꢦꢷꢦ꣄
पीप्
ꢦꣁꢜ꣄ꢱꢾ
पा॑ट्स॑
ꢱꢶꢒꢶꢡ꣄ꢱꣁ
चिकित्सा॑
ꢓꢙ꣄ꢙꢸ
खज्जु
ꢣꢾꢮꢶ
द॑वि
ꢪꢭꢦ꣄ꢬꢮꢵꢲꢪ꣄
मलप्रवाहम्
ꢦꢷꢦꢸ ꢔꢾꢞ꣄ꢞꣁ
पीपु ग॑ड्डा॑
ꢄꢠ꣄ꢒꢶꢥꢶ
इण्किनि
ꢱꢾꢮꢒꢷ / ꢱꢸꢱ꣄ꢬꢸꢱꣁ ꢒꢾꢬ꣄ꢥꢵꢬ꣄
सेवकी / सुस्रुसा॑ क॑र्नार
ꢓꢵꢱ꣄ꢦꣁꢜ꣄ꢜꢸ
खासपा॑ट्टु
ꢓꢵꢱ꣄ꢓꢙ꣄ꢙꢸ
खास्खज्जु
ꢧꢸꢔ꣄ꢥꢶ
फुग्नि
ꢙꢵꢒ꣄ꢬꢡ ꢱꢶꢮꢶ ꢲꣁꢒꢡ꣄
जाक्रत सिवि हा॑कत्
ꢙꢵꢒ꣄ꢬꢡ ꢲꣁꢒꢡ꣄
जाक्रत हा॑कत्
ꢣꣁꢱ꣄ꢒꢵ ꢣꢸꢮ꣄ꢥꣁ
ता॑स्का दुव्ना॑
ꢱꢶꢔꢶꢬ꣄ / ꢱꢶꢔꢸꢬ꣄ / ꢱꢷꢒ꣄
सिगिर् / सिगुर् / सीक
ꢱꢶꢮ꣄ꢥꢶ
सिव्नि
ꢡꢾꢫ꣄ꢭ꣄
त॑य्ल
ꢬꣁꢔ꣄ ꢦꢾꢬ꣄ꢦꢶꢥꢶ
रोग प॑र्पिनि
ꢤꢾꢭ꣄ꢥꢶ ꢮ꣄ꢫꢵꢤꢶ
ध॑ल्नि व्याधि
ꢒꢾꢠ꣄ꢞꢵ ꢬꣂꢒ꣄
क॑ण्डा रोग
ꢱꢾꢒ꣄ꢒꢬꢸ ꢒꣁꢳꢵꢬ꣄
स॑क्करुकोळार्
ꢮꢶꢫꢵꢣꢶꢱ꣄ꢢꢸ / ꢬꣂꢔꢶ / ꢬꣂꢔ꣄ ꢔ꣄ꢬꢱ꣄ꢡꢶ
वियादिस्थु / रोगि / रोग ग्रस्ति
ꢣꢸꢮ꣄ꢥꣁ
दुव्ना॑
ꢦꢬ꣄ꢱ ꢮꢵꢫꢸ / ꢦꢵꢬ꣄ꢱ꣄ꢮ ꢮꢵꢫꢸ
पर्सवायु / पार्स्व वायु
ꢒꢶꢜꢵꢗꢸꢜ꣄ꢜꢸ
किटाचुट्टु
ꢓꢵꢱ꣄
खास्
ꢪꣁꢞ꣄ꢪꢾ / ꢪꣁꢠ꣄ꢪꢾ
माअ॑ड्म॑ / मा॑ण्म॑
ꢣꢵꢣꢸ ꢣꢸꢮ꣄ꢥꣁ
दातु दुव्ना॑
ꢣꢵꢣꢸ ꢦꣁꢭ꣄ꢭꢪ꣄
दादु पा॑ल्लम्
ꢦꢾꢫ꣄ꢡ꣄ꢡꢸ
प॑य्त्तु
ꢙꢬ꣄ꢒꢾꢪ꣄
जर्क॑म्
ꢙꢬ꣄ꢒꢾꢪꢸꢣꢸꢮ꣄ꢥꣁ / ꢦꢭ꣄ꢭꢶꢥꢶ ꢣꢸꢮ꣄ꢥꣁ / ꢦ꣄ꢬꢱꢮ ꢮꢾꢣꢥꣁ
जर्क॑मु दुव्ना॑ / पल्लिनि दुव्ना॑ / प्रसव वेदना॑
ꢆꢦꢩꢵꢤꣁ / ꢆꢨꢵꢤꢒꣁ / ꢆꢦꢵꢤꣁ / ꢧꢭ꣄ꢗꢵ ꢨꢵꢤꣁ
उपबाधा॑ / उबाधका॑ / उपाधा॑ / फल्चा बाधा॑
ꢓꢙ꣄ꢙꢸ
खज्जु
ꢦꢶꢱꣁ
पिसा॑
ꢗꢸꢠ꣄ꢜꢸꢭ꣄
चुण्टुल्
ꢭꢷꢒ꣄
लीक्
ꢪꣁꢱ꣄ꢒꢭ꣄
मा॑स्कल्
ꢪꢾꢖ꣄ꢒꢶꢥꢶ
म॑ङकिनि
ꢮꣀꢣ꣄ꢫꢪ꣄
वैद्यम
ꢮꢣ꣄ꢫ ꢯꢵꢭꣁ
वद्यय शालो
ꢲꣁꢔꢡ꣄
हा॑गत्
ꢪꢭ ꢨꢥ꣄ꢤꢪ꣄
मल बन्धम्
ꢪꣁꢥ꣄ꢥꢸ ꢒꣁꢳꢵꢬ꣄
मा॑न्नु का॑ळार्
ꢔꣁꢳꢶ
गा॑ळि
ꢩꢬꢵꢜ꣄ ꢦꢶꢱꢡ꣄ꢡꢾ / ꢣꢹꢬ꣄ ꢬꢴꢥꢶ
भराट्पिसत्ते / दूर र्हनि
ꢲꢿꢪꢸ ꢣꢸꢮ꣄ꢥꣁ
हेमु दुव्ना॑
ꢔꢸꢠ꣄ꢜꢾꢪ꣄ ꢕꢵꢪ꣄
गुण्ट॑म्घाम्
ꢧꣀꢭꣁ ꢏꢫ꣄ꢡꢦ꣄ꢦꢥ꣄
फैला॑ आ॑य्तप्पन्
ꢪꢸꢞ꣄꣄ꢥꢶ
मुड्नि
ꢔꢸꢞ꣄꣄ꢒꢵꢪ꣄ ꢣꢸꢮ꣄ꢥꣁ
गुड्काम दुव्ना॑
ꢪꢹꢭꢪꢸ ꢒꣁꢳꢵꢬ꣄
मूलमु का॑ळार्
ꢬꢾꢔꢡ꣄ ꢮꢿꢔ꣄ / ꢬꣁꢪꢣꢸ ꢨꢶꢱ꣄ꢱꣁ
र॑गत्वेग् / र॑गतु बिस्सा॑
ꢬꢾꢔꢡꢸ ꢲꢷꢥ꣄
र॑गतु हीन
ꢭꢿꢒꢶꢫꢪ꣄
लेकियम्
ꢮꢭꢶꢮ꣄
वलिव
ꢪꣁꢳꢶꢶ ꢣꢸꢮ꣄ꢥꣁ
मा॑ळि दुव्ना॑
ꢪꢸꢭꢪꢸꢒ꣄ ꢒꣁꢳꢵꢬ꣄
मुलमुक का॑ळार
ꢮꢪ꣄ꢥꢶ
वम्नि
ꢡꣂꢠꢹꢓꢙ꣄ꢙꢸ
तोणुखज्जु
ꢮꢵꢫꢹ
वायू
ꢄꢱ꣄ꢒꢶ
इस्कि
ꢱꢹꢡ꣄ / ꢨꢸꢬꢸꢞꣁ / ꢧꢸꢔ꣄ꢥꢶ
सूत / बुरुडा॑ / फुग्नि
ꢨꢵꢣꣁ
बादा॑

Script - Human

ꢯꢬꢶꢬ꣄ ꢩꢵꢔꢸꢥ꣄
शरिर भागुन
ꢂꢖ꣄ꢔꢪ꣄
अङगम्
ꢨꢵꢣꢪ꣄
पादम्
ꢲꢶꢬꢶꢞꢶ
हिरिडि
ꢦꣁꢒ꣄ꢒꢭ꣄
पा॑क्कल्
ꢣꣀꢬ ꢲꢵꢡ꣄ / ꢣꢒꢸꢥ ꢲꢵꢡꢶ
दैरहात / दकुनहात
ꢒꢿꢜ꣄
केट्
ꢔꢸꢠ꣄ꢞꣁ
गुण्ड॑
ꢬꣁꢦ꣄ꢦꣁ
रा॑प्पा॑
ꢬꢾꢔꢡ꣄
र॑गत्
ꢲ꣄ꢬꢸꢣꢫꢸ / ꢔꢸꢠ꣄ꢞꢾ
ह्रुदयु / गुण्ड॑
ꢡꢶꢳ꣄꣄ꢙꢶ
तिळ्जि
ꢲ꣄ꢬꢸꢞꢶ
ह्रुडि
ꢡꢳꢸ
तळु
ꢃꢖ꣄ꢒꢸ / ꢱꢾꢬꢶꢬ꣄ / ꢡꢥꢸ
आङकु / सेरिर / तनु
ꢃꢖ꣄ꢔꢸ
आङगु
ꢲꣂꢜ꣄
होट
ꢲꢸꢜ꣄ꢜꣁ / ꢙꢷꢬ꣄ꢠꢸ ꢣ꣄ꢬꢮ꣄ꢫꢸ
हुट्टा॑ / जीर्णु द्रव्यु
ꢦꢵꢣꢪ꣄ / ꢡꢳꢦꢵꢄ~
पादम् / तळपाइ~
ꢡꢳꢲꢵꢡ꣄
तळहात्
ꢲꢹꢜ꣄ꢜꣁ
हुट्टा॑
ꢲꢜ꣄ꢒꣁ
हट्का॑
ꢲꢜ꣄ꢒꢵ ꢔꢹꢞ꣄
हट्कागूड्
ꢣꣁꢳꣁ
दा॑ळा॑
ꢣꣁꢳꢵꢪ꣄ ꢦꢥꢶ
दा॑ळाम्पनि
ꢦꢦꣁ
पपा॑
ꢔꢸꢞ꣄ꢔꢵꢭ꣄ / ꢦꢭ꣄ꢜꢶ
गुड्गाल् / पल्टि
ꢔꢾꢳꣁ
ग॑ळा॑
ꢒꢥꢱꢸꢭ꣄ / ꢔꢮ꣄ꢭꣁ / ꢔꢦꢸꢭꣁ
कनसुल् / गव्ला॑ / गपुला॑
ꢔꢵꢭꢸ
गालु
ꢒꢵꢥ꣄
कान्
ꢦꢵꢄ~
पाइ~
ꢒꢺꢡꢵ
कृता
ꢓꢭꢸ ꢏꢣꢞ꣄
खलु आ॑दड्
ꢂꢥ꣄ꢡ꣄ꢬꣁ / ꢱꣁꢪꢵꢥ꣄
अन्त्रा॑ / सा॑मान्
ꢔꢠ꣄ꢜ꣄ꢬꢶ
गण्ट्रि
ꢙꢸꢜ꣄ꢜꢶ
जुट्टि
ꢦꢳ꣄꣄ꢜꢶ
पळ्टि
ꢕꢞꢶ
घडि
ꢡꢶꢳ꣄ꢙꢶ
तिळ्जि
ꢨꣁꢪ꣄ꢨꢶ / ꢥꢵꢩꢶ
बा॑म्बि / नाभि
ꢓꢿꢱ꣄
खेस्
ꢲꢵꢡ꣄
हात्
ꢒꣁꢠ꣄ꢞꢾ / ꢓꣁꢨꣁ
का॑ण्ड॑ / खा॑बा॑
ꢙꢾꢜꣁ
जा॑डा॑
ꢮꢾꢥꢶ
व॑नि
ꢒꢾꢠ꣄ꢜꣁ
क॑ण्डा॑
ꢃꢖ꣄ꢔꢸ
आङगु
ꢥꢴꢥ꣄ꢥ ꢂꢥ꣄ꢡꢬꣁ
न्हन्नअन्तरा॑
ꢪꢹꢡ / ꣄ ꢮꢠ꣄ꢠꢶ
मूत् / वण्णि
ꢒꢶꢳꢖ꣄ꢔꢳꢶꢶ
किळङगिळि
ꢣꢬ꣄ꢙꢥꢶ ꢂꢖ꣄ꢔꢶꢳꢶ / ꢔꢸꢬ꣄ꢣꢸ ꢂꢖ꣄ꢔꢶꢳꢶ
दर्जनि अङगिळि / गुर्तु अङगिळि
ꢣꣁꢱ꣄ꢒꣁ
दा॑स्का॑
ꢒꢦꢵꢭ꣄
कपाल
ꢗꢶꢥ꣄ꢲꢸ
सिनहु
ꢂꢞꣁ
अडा॑
ꢔꢸꢳ꣄ꢳꢸ / ꢔꣁꢡꣁ / ꢮꢶꢥ꣄ꢡꢸꢭ꣄ / ꢦꢶꢙꢵꢮꢸ
गुळ्ळु / गा॑ता॑ / विन्तुल् / पिजावु
ꢣꢵꢞꢶ
दाडि
ꢗꢷꢦꢸ
चिपु
ꢱꢬꢷꢬ꣄ / ꢃꢖ꣄ꢔꢸ
शरीर् / आङ्गु
ꢪꢞꢶ / ꢂꢖ꣄ꢔꢪ꣄
मडि / अङगम्
ꢕꢞꢶ
घडि
ꢨꣁꢙ꣄ꢙꢾ
बा॑ज्ज॑
ꢨꣁꢪ꣄ꢨꢶ
बा॑म्बि
ꢒꢾꢱꢥ꣄ / ꢒꢾꢠ꣄ꢞꣁ
क॑सन् / क॑ण्डा॑
ꢓꢵꢥ꣄ꢣꢸ
खान्दु
ꢬꢾꢜ꣄ꢜꢾ
र॑ट्ट॑
ꢥꢾꢒ꣄ꢒꢸ
न॑क्कु
ꢥꢾꢬꢪ꣄
न॑रम्
ꢙꢷꢦ꣄
जीप्
ꢬꢾꢔꢡ꣄ꢤꢸꢖ꣄ꢒꢭ꣄ / ꢥꢵꢞꢶ
रेगत्धुङ्कल / नाडि
ꢒꢮ꣄ꢭꣁ
कव्ला॑
ꢮꢥꢶ
वनि
ꢒꣁꢮ꣄ꢱꣁ
का॑व्सा॑
ꢲꢿꢪ꣄
हेम्
ꢒꢦꢵꢳ꣄
कपाळ
ꢣꢵꢡ꣄
दात्
ꢦꢔꢸꢭ꣄
पगुल्
ꢦꢨꢶꢥꢶ / ꢦꢮ꣄ꢥꢶ
पबिनि / पव्नि
ꢂꢥ꣄ꢡꢶꢬꣁ
अन्तिरा॑
ꢲꢔꢸꢠ꣄ꢜꣁ
हगुण्टा॑
ꢔꢨꢵꢳ꣄
गबाळ्
ꢔꢨꢵꢳ꣄
गबाळ्
ꢪꢞꢶ / ꢂꢖ꣄ꢔꢪ꣄
मडि / अङगम्
ꢡꣁꢱ꣄ꢒꣁ / ꢪꣁꢠ꣄ꢞꢾ
ता॑स्का॑ / मा॑ण्ड॑
ꢪꣁꢠ꣄ꢜꢾ ꢔꢹꢞ꣄
मा॑ण्ड॑ गूड्
ꢒꢖ꣄ꢒꢸꢬꣁ
कङकुरा॑
ꢪꣁꢗ꣄ꢗꣁ
मा॑च्चा॑
ꢓꢿꢯ꣄
खेश्
ꢪꢙ꣄ꢙꣁ
मज्जा॑
ꢪꢸꢱꢶꢥ꣄ / ꢪꢸꢱꢸꢖ꣄ꢔꢸ
मुसिन् / मुसुङगु
ꢡꣂꢠ꣄
दोण्
ꢪꢹꢜ꣄
मुट्
ꢔꢸꢜ꣄ꢒꣁ
गुट्का॑
ꢓꢿꢯ꣄
केश्
ꢪꢸꢠ꣄ꢞꣁ
मुण्डा॑
ꢦꢵꢜ꣄
पाट्
ꢦꢵꢜꢸꢲꢜ꣄ꢒꣁ
पाटु हट्का॑
ꢣꢸꢣ꣄ꢡꢸ / ꢣꢹꢡ꣄ ꢲꣁꢮꢶ
दुद्तु / दूत हा॑वि
ꢔꢸꢜ꣄ꢒꣁ
गुटको
ꢗꢾꢪ꣄ꢪꢬ꣄ ꢲꢵꢡ꣄ / ꢓꣁꢨꣁ
चेम्मर्हात् / खोबो
ꢥꢵꢒ꣄
नाक्
ꢥꢵꢔꢸꢦꢸꢜ꣄ꢜꣁ
नागुपुट्टा॑
ꢩꢥ꣄ꢣꢶ
भन्दि
ꢪꢾꢣꢸꢞ꣄ / ꢪꢱ꣄ꢡꢶꢱ꣄ꢒꣁ / ꢩꢶꢣꢸꢜ꣄
म॑दुड / मस्तिस्का॑ / भिदुट
ꢆꢛ꣄ꢗꢵ ꢏꢡꢜ꣄
उञ्चा हा॑ट
ꢪꣁꢜ꣄ꢜꢾ
मा॑ट्ट॑
ꢪꣁꢳꢶ
मा॑ळि
ꢪꢸꢡ꣄ꢣꢶ ꢂꢖ꣄ꢒꢶꢳꢶ
मुत्दि अङकिळि
ꢗꢷꢦꢸ
चीपु
ꢩꢵꢖ꣄ꢔꢸ
भाङगु
ꢔꢸꢪ꣄ꢦꢶꢥꢶ
गुम्पिनि
ꢦꣂꢜ꣄
पोट्
ꢙꣀꢥ ꢲꢵꢡ꣄ / ꢙꢾꢬꢸꢥ ꢲꢵꢡ꣄
जैनहात् / जगुनहात्
ꢡꣂꢠ꣄
तोण्
ꢱꢾꢒꣁ
स॑का॑
ꢂꢖ꣄ꢒꢶꢳꢶ
अङकिळि
ꢦꣁꢒ꣄ꢒꣁ
पा॑क्का॑
ꢦꣁꢒ꣄ꢒꣁ ꢲꢜ꣄ꢒꣁ
पा॑क्का हट्का॑


Script - House


ꢕꢾꢬ꣄ ꢒꢶꢥꢸ ꢕꢾꢬꢸ ꢗꢾꢬꢾ ꢩꢵꢔꢸꢥ꣄
घेर किनु घेरु च॑र॑ भागुन
ꢲꣁꢞꢵꢬ꣄
हा॑डार्
ꢬꢮꢸꢳ꣄
रवुळ
ꢕꣁꢪ꣄ꢪꣁ / ꢂꢬꣁ / ꢡꢮ꣄ꢬꢪ꣄
घा॑म्मा॑ / अरा॑ / तव्रम
ꢕꢿꢬ꣄
घेर्
ꢓꢥꢶꢡꢮ꣄ꢬꢪ꣄ / ꢲꢥ꣄ꢣꢮꢸ ꢡꢮ꣄ꢬꢪ꣄
खनि तव्रम / हन्दवु तव्रम
ꢆꢛ꣄ꢗꢳꣁ / ꢲꢶꢥ꣄ꢣꢳꢶ
उञ्चळा॑ / हिन्दळि
ꢓꢮ꣄ꢬꢵ ꢕꢿꢬ꣄
खव्राघेर्
ꢓꢮ꣄ꢬꣁ
खव्रो
ꢐꢞꣁ
आ॑डा॑
ꢦꢬꢸꢠ꣄ꢜꢵ ꢕꢿꢬ꣄
परुण्टाघेर्
ꢩꢮꢥ꣄
भवन्
ꢒꢮꢵꢜ꣄
कवाट्
ꢬꢴꢾꢜꣁ
र॑डा॑
ꢗꢶꢞꢵꢫ ꣄ꢣꢾꢫ꣄ꢞꣁ / ꢒꢳꢵ ꢣꢾꢔꢸꢞꣁ
चिडाय्देय्डो / कळादेगुडो
ꢪꢳꣁ
मळा॑
ꢲꢷꢬ꣄
हीर्
ꢒꢸꢜ꣄ꢱꢾ
कुट्स॑
ꢒꣁꢳꢵꢫ꣄ / ꢥꢳꢶꢒꣁ
का॑ळाय / नळिका॑
ꢱ꣄ꢥꢵꢥꢸ ꢕꢿꢬ꣄
स्नानु घेर
ꢓꣁꢜ꣄ꢜꣁ
खा॑ट्टा॑
ꢨꣁꢜ꣄ꢜꢵ ꢪꣃꢞꣁ
बा॑ट्टा मौडा॑
ꢪꢴꢸꢔꢸꢜ꣄
म्हुगुट
ꢒꢮꢵꢞꢸ ꢤꢵꢠ꣄
कवाडु धाण
ꢒꣁꢭ꣄ꢒꢶ
का॑ल्कि
ꢪꢸꢔ꣄ꢔꢸ
मुग्गु
ꢲꢥ꣄ꢡꢮꢸ ꢡꢮ꣄ꢬꢪ꣄
ह्न्तवु तव्रम्
ꢮꢶꢞꢶ
विडि
ꢮꢶꢜꢶ ꢱꢳꢵꢒ꣄
विडि सळाक्
ꢡꢹꢪ꣄ꢦꣁ / ꢙꢾꢖ꣄ꢙꢵꢬ꣄
तूम्पा॑ / जेञ्जार
ꢬꢾꢖ꣄ꢒꢸ
र॑ङकु
ꢦꢷꢔꢵꢡ꣄
पीगात्
ꢮꢶꢜꢶ
विटि
ꢮꢶꢜ꣄ꢒꢾ / ꢮꢶꢞ꣄ꢔꢶꢥꢾ
विट्क॑ / विड्गिन॑
ꢡꢳꢪ꣄ / ꢩꣁꢄ
तळम् / भोइ
ꢡꢳꢪ꣄
तळम्
ꢲꣁꢳ꣄ꢜꣁ
हा॑ळ्टा॑
ꢦꢜꢸꢡꣁ
पटुता॑
ꢓꢵꢪ꣄ꢨꢸ
खाम्बु
ꢔꣂꢱꢵꢭꣁ / ꢔꢵꢫ꣄ꢔꣁꢬꢸꢥꢸꢓꣁꢜ꣄ꢜꣁ
गो शाला॑ / गाय्गा॑रुनु खा॑ट्टा॑
ꢭꢵꢥ꣄ / ꢥꢥ꣄ꢡꢮꢥꢸ
लान् / नन्तवनु
ꢡꣁꢬꢠ꣄
ता॑रण्
ꢡꢵꢪ꣄
ताम्
ꢮꢶꢣ꣄ꢣꢾ / ꢪꢴꢞꢶ
विद्द॑ / म्हडि
ꢦꢥꢶ ꢥꢶꢮꢶ / ꢦꢥꢶꢡꣁꢜ꣄ꢜꢶ
पनि निवि / पनिता॑ट्टि
ꢡꢬꢸꢪ꣄ ꢦꢸꢬꣁ
तरुम्पुरा॑
ꢱꣂꢦꢵꢠ꣄ /
सोपाण
ꢪꢾꢬ꣄ꢒꢠꢶ
म॑र्कणि
ꢪꢾꢜ꣄ꢒꢥꢶ
म॑ट्कनि
ꢥꢶꢛ꣄ꢙꢬꢶꢫꢡꢮ꣄ꢬꢪ꣄ / ꢱꢫꢥ ꢡꢮ꣄ꢬꢪ꣄
निञ्जरिय तव्रम / सयन तव्रम
ꢪꣃꢮ꣄ꢞꣁ
मौडा॑
ꢦꢭꢶꢖ꣄ꢔꢶ ꢣꢾꢫ꣄ꢞꣂ
पलिङगि द॑य्डा॑
ꢤꢹꢪꢸ ꢕꢹꢞ꣄
धूमु घूड
ꢤꢹꢪ꣄ꢙꢮꢞ꣄ꢥꢶ
धूम्जवड्नि
ꢦꢱ꣄ꢒꢜ꣄ ꢲꣁꢜꢵꢬ꣄
पस्कट हा॑टार्
ꢦꢹꢙꢵ ꢂꢬꣁ
पूजा अरो
ꢨꢷꢒ꣄
बीक्
ꢗꢸꢜ꣄ꢜꢸ ꢦꢷꢡ꣄
चुट्टु पीत्
ꢕꢿꢬꢸ ꢢꢵꢪ꣄
घेरु थाम्
ꢦꢷꢞꢸ ꢪꢸꢔ꣄ꢔꢸ
पीडु मुग्गु
ꢕꣁꢮ꣄ꢭꣁ
घा॑व्ला॑
ꢮꢶꢣ꣄ꢣꢾ
विद्द॑
ꢬꢮꢸꢳ꣄꣄
रवुळ
ꢲꣁꢜꢵꢬ꣄
हा॑टार्
ꢩꣁꢖ꣄ꢔ꣄ꢸ
भा॑ङग
ꢪꢸꢭꣁ / ꢆꢪ꣄ꢨ꣄ꢬꣁ
मूला॑ / उम्ब्रा॑
ꢬꢾꢖ꣄ꢔꢸ
र॑ङगु
ꢱ꣄ꢮꢵꢔꢡ ꢂꢬꣁ
स्वागत अरा॑
ꢨꢜ꣄ꢒꢾ
बट्के
ꢨꢜ꣄ꢒꢾ ꢕꢿꢬ꣄
बट्के घेर्
ꢣꢵꢬ꣄
दार
ꢤꢜꣁ
धडो
ꢦꢖ꣄ꢓꣁ / ꢮꢶꢙꢥꣁ
पङखो / विजना॑
ꢣꢶꢮꣁ
दिवा॑
ꢧꢵꢜ꣄
फाट
ꢃꢮꢬꢠꣂ
आवरणा॑




Script - House Hold Items


ꢕꢾꢬꢸ ꢮꢱ꣄ꢡꢸꢥ꣄
घेरु वस्तुन
ꢗꢸꢳ꣄ꢳꣁ
चुळ्ळा॑
ꢡꢜꣁ
तटो
ꢄꢜ꣄ꢒꢶ / ꢮꢶꢜ꣄ꢒꢶ
इट्कि / विट्कि
ꢭꢴꣁꢔꢠꢸꢦꢾꢜꢶ
ल्हा॑गणुप॑टि
ꢱꢸꢬꢸꢔ꣄
सुरुग
ꢔꢾꢱꢶꢥ ꢶꢦꢾꢜꢶ
ग॑सिनि प॑टि
ꢱꢜꣁ / ꢱ꣄ꢬꢿꢠꢶ
सटा॑ / स्रेणि
ꢗꢶꢡ꣄ꢬꢸ / ꢗꢶꢡ꣄ꢡꢸꢬ꣄
चित्रु / चित्तुर
ꢪꢛ꣄ꢗꢸ / ꢪꣁꢛ꣄ꢗꣁ
मञ्चु / मा॑ञ्चा॑
ꢕꢾꢜꢶꢔꢳꣁ
घ॑टिगळा॑
ꢣꢮ꣄ꢠꣁ / ꢂꢣ꣄ꢣꢪ꣄
दव्णा॑ / अद्दम
ꢘꢸꢬꢶ
छुरि
ꢒꢾꢡ꣄ꢡꢶꢬꢶꢒꢾ
क॑त्तिरिक॑
ꢒꢪ꣄ꢨ꣄ꢭꣁ / ꢧꢖ꣄ꢔꢸꢬꣁ / ꢇꢬ꣄ꢠꢸꢧꢖ꣄ꢔꢸꢬꣁ
कम्ब्ळा॑ / फङ्गुरा॑ / ऊरणु फङ्गुरा॑
ꢓꢜ꣄ꢜꢶ
खट्टि
ꢦꢵꢄ~ ꢦꣁꢱꢸꢥꢵꢮ꣄
पाइ~ पा॑सुनाव
ꢦꣃꢱꢸꢭ꣄
पौसुल्
ꢔꢸꢖ꣄ꢔꢸꢪꢸ ꢩꣁꢬꢠꢶ
गुङ्गुमु भा॑रणि
ꢱꢣꢶ / ꢘꢡ꣄ꢬꢶ
सदि / छत्रि
ꢔꢾꢭ꣄ꢭꣁ
ग॑ल्ला॑
ꢔꢸꢡ꣄ꢡꢶ
गुत्ति
ꢔꢸꢦ꣄ꢦꣁ / ꢲꢷꢞꢸꢮꢱ꣄ꢡꢸꢥ꣄
कुप्पा॑ / हीडुवस्तुन
ꢔꢾꢭ꣄ꢭꣁ
ग॑ल्ला॑
ꢒꣂꢮꢶ / ꢧꢸꢥ꣄ꢥꢳꢶ
कोवि / फुन्नळि
ꢒꣁꢳꢵꢫ꣄ / ꢥꢳꢶ
का॑ळाय / नळि
ꢲꢵꢡꢸ ꢓꣁꢳ꣄ꢜꢶ
हातु खा॑ळ्टि
ꢦꢶꢱꢸꢳꢵ ꢏꢭꣁ
पिचुळा आ॑लो
ꢱꢶꢬ꣄ꢒꢠ꣄ / ꢯ꣄꣄ꢬꢷꢔꢥ꣄ꢤꢸ
सिर्कण / श्रीगन्धु
ꢙꢾꢖ꣄ꢔꢳꢪ꣄
ज॑ङ्गळम
ꢬꢵꢒ꣄
राक्
ꢮꢱ꣄ꢡꢸꢥ꣄꣄ / ꢙꢪꢵꢥꢸꢥ꣄
वस्तुन / जमानुन
ꢨꢶꢔꢵꢡ꣄
बिगात
ꢧꣁꢥ꣄ꢥꢶ
फोन्नि
ꢩꢷꢡꢸ ꢕꢾꢞꢶꢔꢳꣁ
भीतु घेडिगळा॑
ꢨꣁꢖ꣄ꢔꢸ ꢡꢜ꣄ꢜꢶ
बा॑ङ्गु तट्टि
ꢭꣀꢞꣁ / ꢭꢔꢸꢞꣁ
लैडा॑ / लगुडा॑
ꢨꢠꢵꢭ꣄ ꢭꢔꢸꢞꣁ
बणाल्लगुडा॑
ꢲꢡ꣄ꢬꢥ꣄
हत्रन
ꢡꢾꢭ꣄ꢒꢜ꣄ / ꢲꢸꢪ꣄ꢬꣁ / ꢣꢶꢠ꣄ꢞꢸ / ꢪꣁꢭ꣄ꢜꢶ
तेल्कट / हुम्रा॑ / दिण्डु / मा॑ल्टि
ꢮꢵꢡ꣄
वात
ꢣꢶꢮꣁ
दिवा॑
ꢭꣁꢪ꣄ꢨꢥ꣄ ꢣꢶꢮꣁ
ला॑म्बन्दिवा॑
ꢦꢭ꣄ꢭꣁ / ꢦꢳ꣄ꢳꣁ
पल्ला॑ / पळ्ळा॑
ꢒꢾꢱꢶꢥꢶ ꢦꢾꢜꢶ
केसिनि प॑टि
ꢥꢶꢮꢶ / ꢡꣁꢜ꣄ꢜꢶ
निवि / तोट्टि
ꢬꢹꢦꢣꢬ꣄ꢯꢶꢥꢶ
रूप दर्शिनि
ꢣꢹꢬ꣄ ꢮꢣꢶꢥꢶ
दूर्वदिनि
ꢒꢾꢰꢠ꣄ ꢓꣁꢳ꣄꣄ꢜꢶ
क॑षण खा॑ळ्टि
ꢓꢵꢥꢣꢸ ꢓꣁꢳ꣄꣄꣄ꢜꢶ
खा॑ळ्टि
ꢣꢶꢥ꣄ꢥꢸ ꢣꢾꢒ꣄ꢒꢜ꣄ꢥꢶ / ꢣꢶꢥꢗꢬ꣄ꢫꣁ
दिन्नु द॑क्कट्नि / दिनचर्या॑
ꢗꢵꢬ꣄ꢦꢵꢄ~ ꢡꢶꢮꢶ / ꢒꢸꢬ꣄ꢱꢶ
चार्पाइ~ तिवि / कुर्सि
ꢒꣂꢥ꣄ꢡꢸ / ꢣꢶꢞ꣄ꢞꢸ / ꢮꢭ꣄ꢭꢶꢬ꣄
कोन्तु / दिड्डु / वज्जिर
ꢗꢶꢡ꣄ꢡꢸꢬ꣄ / ꢭꣂꢱ꣄
चित्तुर / लोस
ꢱꢫꢥꢶ
सयनि
ꢱꢫꢥꢸ ꢲꢡ꣄ꢬꢥ꣄
सयनु हत्रन
ꢒꢸꢡꢸꢬ꣄
कुतुर्
ꢣꢵꢡꢸ ꢨꢸꢬꢸꢱ꣄ / ꢣꢵꢡꢸ ꢪꢛ꣄ꢙꢥ꣄ / ꢞꢵꢡꢸ ꢔꢾꢱꢶꢥꢶ
दातुबुरुस / दातुमञ्जन / दातु ग॑सिनि
ꢣꢵꢡꢸꢭꢿꢲꢶ
दातुलेहि
ꢣꢵꢡꢸ ꢩꢸꢬ꣄ꢒꣁ
दातु भुर्का॑
ꢌꢣꢸꢥꢪ꣄ / ꢦꢵꢡ꣄ꢬꣁ
ए॑दुनम / पात्रा॑
ꢗꢦꣂ
चपा॑
ꢔꢾꢜ꣄ꢦꢵꢬꣁ / ꢓꢥꢵꢮ꣄
ग॑ट्पारा॑ / खनाव
ꢤꢹꢪ꣄ ꢭꣂꢱ꣄ / ꢥꢷꢞꢵ ꢭꣂꢱ꣄ / ꢩꢵꢮ ꢗꢶꢡ꣄ꢡꢸꢬ꣄
धूम्लोस / नीडा लोस / भावचित्तुर
ꢥꢵꢳꣁ
नाळा॑
ꢧꢹꢭꢸ ꢥꢶꢮꢶ
फूलु निवि
ꢦꢾꢜꢶ
प॑टि
ꢦꢶꢳ꣄ꢜꢶ
पिळ्टि
ꢧꢖ꣄ꢔꢸꢬꣁ / ꢧꢖ꣄ꢔꢸꢬꢶ
फङ्गुरा॑ / फङ्गुरि
ꢕꢾꢜꢶ
घ॑टि
ꢦꢵꢫ꣄ꢥ꣄ ꢦꣁꢱꢶꢭ꣄ꢥꢶ
पाय्न प॑सिल्नि
ꢮꢶꢣ꣄ꢫꢸꢡ꣄ꢮꢶꢙꢥꣁ
विद्युत्विजनो
ꢮꢶꢣ꣄ꢫꢸꢮꢶꢡ꣄ ꢣꢶꢮꣁ
विद्युत्दिवा॑
ꢢꢷꢥ꣄ꢦꢵꢄ~ ꢡꢶꢮꢶ
थीन्पाइ~ तिवि
ꢪꢾꢣꢸꢳꣁ
मेदुळा॑
ꢪꢾꢫꢶꢥꢸ ꢮꢵꢡ꣄ / ꢪꣂꢪ꣄ ꢮꢵꢡ꣄
म॑यिनु वात / मोम्वात
ꢪꢿꢙꣁ
मेजा॑
ꢮꢵꢬ꣄ / ꢚꢠ꣄ꢠꢶ
वार् / झण्णि
ꢒꢸꢞꣁ
कुडा॑
ꢔꢮ꣄ꢥꢶ ꢦꢾꢜꢶ ꢂꢒꢵꢱ꣄ ꢤꣁꢥꢶ ꢦꢾꢜꢶ
गव्नि प॑टि / अकास धा॑नि प॑टि
ꢮꢶꢙꢥꣁ
विजना॑
ꢡꢶꢮꣁ
तिवा॑
ꢚꢠ꣄ꢠꢶ
झण्णि


Script - Kinship


ꢏꢱ꣄ꢡꢸꢥꢸ ꢥꢵꢮꢸꢥ꣄
ओस्तुनु नावुन
ꢨꢾꢫ꣄
ब॑य्
ꢣꢣꣁ
ददा॑
ꢩꢮꢶ
भवि
ꢩꢮꣁ
भवा॑
ꢧꢸꢄ~
फुइ~
ꢂꢪ꣄ꢪꣁ
अम्मा॑
ꢨꣂ / ꢨꢵꢦ꣄
बो / बाप्
ꢂꢪ꣄ꢨꣁ
अम्बा॑
ꢂꢙ꣄ꢙꢶ
अज्जि
ꢂꢙ꣄ꢙꢶ ꢂꢪ꣄ꢨꣁ
अज्जि अम्बा॑
ꢒꢵꢪ꣄ ꢒꢾꢬ꣄ꢡ꣄ꢡꢶꢥ꣄
काम क॑र्त्तिन्
ꢱꢾꢥ꣄ꢡꣁꢙꢶꢥ꣄ / ꢨꣀꢨꢾꢫ꣄ꢥꢾꢥ꣄
स॑न्ता॑जिन / भै भेय्न॑न
ꢨꢥ꣄ꢤꢸꢙꢾꢥꢵꢥ꣄ / ꢐꢱ꣄ꢡꢸꢥ꣄
बन्धुज॑नान / आ॑स्तुन
ꢨꢥ꣄ꢣꢸꢦꢥ꣄ / ꢏꢱ꣄ꢡꢸ
बन्धुपन / आ॑स्तु
ꢣꢾꢮ꣄ꢬꢥꢶ ꢚꢾꢞꢥꢶꢥ꣄
देव्रन् / झ॑टनिन्
ꢣꢭ꣄ꢭꣁ / ꢦꢡꢶ / ꢩꢬ꣄ꢡꣁ / ꢂꢪ꣄ꢨꢸꢭꣁ
दल्ला॑ / पति / भर्ता॑ / अम्बुला॑
ꢦꢶꢭ꣄ꢭꣁ / ꢨꢵꢳꢸ / ꢥꢴꢸꢬꢸ
पिल्ला॑ / बाळु / न्हुरु
ꢨꢵ ꢂꢙ꣄ꢙꣁ
बा अज्जा॑
ꢨꢵ ꢂꢙ꣄ꢙꢶ
बा अज्जि
ꢦꣁꢥ꣄ ꢥꢡꢶꢥꢶ
पा॑न् नतिनि
ꢦꣁꢥ꣄ꢥꢡ꣄ꢡꢾ
पा॑न्नत्त॑
ꢣꢾꢮꢬ꣄
द॑वर्
ꢥꢾꢥꢥ꣄ꢡꢸ / ꢥꢿꢥ꣄ꢣꢸ
न॑नन्तु / नेन्दु
ꢱꣁꢮꢡ꣄
सा॑वत्
ꢱꢾꢬ꣄ꢔꢸꢜ꣄ / ꢱꢞ꣄ꢔꢸꢜ꣄
सा॑र्गुट / सड्गुट
ꢱꢾꢖ꣄ꢒꣁ ꢆꢙꢾꢱ꣄ꢡꢾꢥꣁ / ꢩꣀ
स॑ङ्का॑ उज॑स्त॑ना॑ / भै
ꢱꢾꢖ꣄ꢒꣁ ꢆꢙꢾꢱ꣄ꢡꢶꢥꣁ / ꢩꢾꢫ꣄ꢥ꣄
स॑ङ्का॑ उज॑स्तिना॑ / भ॑य्न्
ꢮꢾꢱꢶꢥ꣄ꢡꢶ
व॑सिन्ति
ꢮꢾꢱꢶꢥ꣄ꢡꢶꢥ꣄
व॑सिन्तिन्
ꢥꢴꢥ꣄ꢥꢨꣂ / ꢒꢒꣁ
न्हन्नबा॑ / कका॑
ꢪꣃꢱꢶ
मौसि
ꢥꢴꢥ꣄ꢥꢪ꣄ꢨꣂ
न्हन्नम्बो
ꢩꢾꢫ꣄ꢥ꣄
भ॑य्न्
ꢨꣀꢫ꣄
बैय्
ꢨꢾꢫ꣄
बेय
ꢨꢾꢜꣁ
ब॑टा॑
ꢂꢫ꣄ꢫꣂ
अय्या॑
ꢂꢪ꣄ꢪꣁ
अम्मा॑
ꢂꢙ꣄ꢙꣁ
अज्जा॑
ꢡꢭ꣄ꢭꣂ
तल्ला॑
ꢂꢖ꣄ꢒꢿꢬ꣄ ꢨꣁ
अङक॑र् बो
ꢂꢖ꣄ꢒꢿꢬꢪ꣄ꢨꣁ꣄
अङक॑रम्बो
ꢨꢾꢫ꣄ꢭ꣄ / ꢨꣀꢭ꣄ / ꢩꢵꢬꢶ / ꢩꢵꢬꢶꢫꣁ / ꢱꢡꢶ
ब॑य्ल / बैल / भारि / भारिया॑ / सति
ꢪꢴꣁꢜ꣄ꢜ ꢨꣂ
म्हा॑ट्टबो
ꢪꣁꢜ꣄ꢜꢪ꣄ ꢨꣂ
म्हा॑ट्टम्बो
ꢪꢵꢫ꣄ꢨꢵꢦ꣄ / ꢂꢪ꣄ꢨꣁ ꢨꣂ
माय्बाप / अम्बा॑बो
ꢥꢡꢶꢥꢶ
नतिनि
ꢥꢡ꣄ꢡꢾ
नत्त॑
ꢨꢾꢜꢶ
ब॑टि
ꢱꢳꣁ
सळा॑
ꢩꣁꢮ꣄ꢠ꣄ꢜꢶ
भोवण्टि
ꢙꣁꢪꣀ
जा॑मै
ꢨꢾꢫ꣄ꢭ꣄
ब॑य्ल्
ꢪꢪꣁ
ममा॑
ꢱꣁꢱꢸꢬꣁ
सा॑सुरा॑
ꢪꢪꣁ
ममो
ꢪꢪꢶ
ममि
ꢱꢱꢸ
ससु
ꢱꢭꣂ
सलो
ꢏꢳ꣄ꢞꢸꢥ꣄
आ॑ळ्डुन्


Script - Kitchen


ꢲꢥ꣄ꢣꢮꢸ ꢡꢮ꣄ꢬꢪ꣄ ꢒꢶꢥꢸ ꢲꢥ꣄ꢡꢮꢸ ꢦꢵꢡ꣄ꢬꢵꢥ꣄
हन्दवु तव्रम किनु हन्तवु पात्रान
ꢂꢮ꣄ꢒꣁ
हव्का॑
ꢩꢮ꣄ꢥꢱ꣄
भव्नस्
ꢩꢮ꣄ꢥꢱ꣄
भव्नस्
ꢗꢸꢭ꣄ꢭꣁ
चुल्ला॑
ꢚꢫ꣄ꢥꣁ
झय्ना॑
ꢂꢠ꣄ꢞꣁ
हण्डा॑
ꢂꢦ꣄ꢦꢸꢞꢵꢭꢸ ꢣꢾꢫ꣄ꢞꣁ
अप्पुडालु द॑य्डा॑
ꢂꢦ꣄ꢦꢸꢞꢵꢭꢸ ꢒꢾꢜ꣄ꢜꢾ
अप्पुडालु क॑ट्ट॑
ꢦꢜꣁ
पटा॑
ꢮꢳꢶ
विळि
ꢲꣁꢔꢭ꣄
होगल्
ꢮꢵꢦ꣄
वाप्
ꢧꢭꢵꢬꢸ ꢲꢠ꣄ꢞꣁ
फलारु हण्डा॑
ꢧꢭꢵꢬꢸ ꢡꢾꢜ꣄ꢜꣁ
फलारु त॑ट्टा॑
ꢄꢜ꣄ꢒꢶ
इट्कि
ꢭꢴꣁꢒꢠꢸ ꢦꣁꢳꣁ
ल्हा॑गणु पा॑ळा॑
ꢭꢴꣁꢒꢠꢸ ꢪꢸꢱꢳ꣄
ल्हा॑गणुमुसळ्
ꢪꢸꢗꢭ꣄
मुचल्
ꢱꢶꢒꣁ
सिका॑
ꢮꢶꢱ꣄ꢡꢮ꣄
विस्तव्
ꢦꣁꢳꣁ
पा॑ळा॑
ꢦꢸꢜ꣄ꢜꢭ꣄ꢭꢸ ꢲꢮ꣄ꢒꣁ
पुट्टल्लु हव्का॑
ꢂꢥꢭ꣄
अनल्
ꢦꣁꢳꢶ
पा॑ळि
ꢓꣁꢳ꣄꣄ꢗꢾ
खा॑ळ्च॑
ꢡꣁꢮ꣄ꢭꢶ
ता॑व्लि
ꢣꢾꢔꢸꢞꢵ ꢲꢠ꣄ꢞꢶ
द॑गुडा हण्डि
ꢒꣀꢭꢒꢾꢱꢸꢬꢸ ꢓꣁꢮ꣄ꢞꢶ
कैलक॑सुरु खोव्डि
ꢦꢶꢖ꣄ꢔꢠꢶ
पिङगणि
ꢡꢪ꣄ꢨꢸꢬꢪꢸ ꢩꣁꢥ꣄ꢥꣁ
तम्बुरमु भा॑न्ना॑
ꢗꢶꢦ꣄ꢦꣁ
चिप्पा॑
ꢓꣁꢭ꣄ꢗꢵꢗꢸꢭ꣄ꢭꣁ / ꢒꣁꢜ꣄ꢦꣀ ꢗꢸꢭ꣄ꢭꣁ
खोल्चा चुल्ला॑ / का॑ट्पै चुल्ला॑
ꢒꣀꢔꢶ
गैटि
ꢤꢶꢞ ꢲꢵꢡ꣄
धिडा हात
ꢣꢾꢱꢾ
द॑स॑
ꢙꢾꢭ꣄ꢭꢜ꣄
ज॑ल्लट्
ꢬꢵꢒ꣄
राक्
ꢥꢭꢾꢬ꣄ ꢗꢶꢦ꣄ꢦꣁ
नळ॑र्चिप्पा॑
ꢗꢶꢦ꣄ꢦꣁ ꢲꢮ꣄ꢒꣁ
चिप्पा हव्का॑
ꢩꢸꢛ꣄ꢙꢸꢥꢵ ꢲꢠ꣄ꢞꢶ
भुञ्जुना हण्डि
ꢱꢸꢞꣁ / ꢱꢸꢦ꣄ꢞꣁ / ꢩꢖ꣄ꢔꢸꢞꢮ꣄
सुडा॑ / सुप्डा॑ / फङ्गुडाव
ꢜꢦ꣄ꢦꣁ
टप्पा॑
ꢡꢾꢜ꣄ꢜꣁ / ꢲꢬ꣄ꢮꢶ
त॑ट्टा॑ / हर्वि
ꢒꣁꢜꢸꢪ꣄
का॑टुम्
ꢗꢒꢶ
चकि
ꢲꢸꢳꣁ / ꢮꢶꢱ꣄ꢡꢮ꣄ / ꢮꢶꢖ꣄ꢒꢳ꣄
हुळा॑ / विस्तव / विङ्कळ
ꢡꢶꢮꢵꢦꢾꢜꢶ
तिवाप॑टि
ꢗꢸꢳꢸꢥ꣄ꢣꢸ
चुळुन्दु
ꢪꣁꢡ꣄ꢡꢸ
मा॑त्तु
ꢥꢬꢳꢸ ꢡꢸꢬ꣄ꢒꣁ
नरळु तुर्का॑
ꢤꢶꢞꢵ ꢲꢠ꣄ꢞꢶ
धिडा हण्डि
ꢦꢥꢶ ꢮꢵꢦ꣄
पनिवाप्
ꢲꢸꢳꣁ
हुळा॑
ꢒꢸꢳꢶ ꢲꢠ꣄ꢞꢶ
कुळि हण्डि
ꢩꣁꢬꢠꢶ
भा॑रणि
ꢦꣁꢳꢳꢵ ꢧꢸꢜ꣄ꢒꢶ
पा॑ळ्ळा फुट्कि
ꢦꢵꢡ꣄ꢬꣁ
पात्रा॑
ꢤꢹꢪ꣄
धूम्
ꢭꢪ꣄ꢨꢸ ꢦꢸꢜ꣄ꢜꢶ
लम्बु पुट्टु
ꢘꢸꢬꢶ
छुरि
ꢔꢸꢱꢸꢭꢡ꣄ꢡꢾ ꢪꣁꢡ꣄ꢡꢸ
गुसुलत्त॑ मा॑त्तु
ꢒꢾꢜ꣄ꢜꢾ ꢦꢵꢡ꣄ꢬꣁ
क॑ट्ट॑ पात्रा॑
ꢡꢾꢥ꣄ꢡꢸꢭꢵ ꢦꢶꢳ꣄ꢥꢵꢮ꣄
त॑न्तुला पिळ्नाव्
ꢙꢒꢸꢥꣁ
जकुना॑
ꢦꢾꢭꣁ / ꢨꣂꢥꢶ
पा॑ला॑ / बोनि
ꢙꢾꢭ꣄ꢭꢜ꣄
ज॑ल्लट
ꢩꢸꢛ꣄ꢗꢸꢥꢵ ꢲꢠ꣄ꢜꢶ
भुञ्चुनाहण्टि
ꢮꢵꢬ꣄ꢦꢸꢠ꣄ꢜꢶ
वार्पुण्टि
ꢭꣀꢒꢸꢜꣁ
लैकुटा॑
ꢗꢾꢒ꣄ꢒꢠꢶ
च॑क्कणि
ꢒꢗꢵ ꢦꢵꢡ꣄ꢬꣁ
कसापात्रा॑


Script - Law and Order


ꢱꢵꢱꢥꣁ ꢒꢶꢥꢸ ꢃꢙ꣄ꢛꣁ
सासना॑ किनु आज्ना॑
ꢂꢠ꣄ꢗꢸ ꢮꢔꢡꢶ
अण्चुव गति
ꢂꢥ꣄ꢫꢵꢮ꣄ / ꢂꢒ꣄ꢬꢪꣁ / ꢂꢞꢡ꣄
अन्याव / अक्रमा॑ / अडात
ꢂꢞꢵꢡ꣄ / ꢂꢥ꣄ꢫꢵꢮ꣄ / ꢃꢥꢷꢞꢶ
अडात / अन्याव / अनीदि
ꢂꢦꢬꢵꢤ꣄
अपराध
ꢂꢪꢭ꣄ / ꢦꢬꢶꢦꢵꢭꢥꣁ
अमल् / परिपालना॑
ꢬꢾꢗ꣄ꢗꢒꢹꢡ꣄ / ꢂꢬꢵꢙꢒꢡꣁ / ꢂꢭꢲꣁ
र॑च्चकूत / अराजकता॑ / कलहा॑
ꢃꢙ꣄ꢛꣁ / ꢆꢡ꣄ꢡꢬ꣄
आझञो / उत्तर
ꢃꢙ꣄ꢛꢵꢒꢵꢬ꣄
आजञाकार
ꢂꢤꢵꢬ꣄ / ꢬꢸꢙꢸ
अधार् / रुजु
ꢱꣂꢤꢥꣁ ꢒꢾꢬ꣄ꢥꢵꢬ꣄ / ꢱꣁꢤꢸꢥꢵꢬ꣄
सोधना॑ क॑र्नार / सोधुनार
ꢂꢫ꣄ꢣꢸꢦꢳꣁ / ꢱꢾꢥ
अय्दुपळा॑ / सेन
ꢃꢫꢸꢱ꣄ꢣꢾꢠ꣄ꢞꢥꣁ
आयुद॑ण्ड्ना॑
ꢃꢬ꣄ꢩꢵꢜꣁ / ꢬꢾꢗ꣄ꢗꢵ ꢬꢾꢗ꣄ꢗꣁ
अर्भाटा॑ / र॑च्चा॑र॑च्चा॑
ꢦꢡ꣄ꢬꣁ / ꢣꢱ꣄ꢡꢵꢮꢾꢙ꣄
पत्रा॑ / दस्तावेज
ꢩꢵꢬꢡ ꢣꢠ꣄ꢞꢥꢵ ꢱꢵꢱꢥꣁ
भारत दण्डना सासना॑
ꢱꢖ꣄ꢒꢪ꣄ / ꢱꢪ꣄ꢱ꣄ꢡꢵꢥ꣄
सङकम् / सम्स्तान्
ꢒꢸꢭꢥꢵꢱ꣄
कुलनास्
ꢆꢗ꣄ꢗ ꢥ꣄ꢫꢵꢫꢵꢭꢫꣁ
उच्च न्यायालया॑
ꢆꢦꢮꢵꢱ꣄
उपवास
ꢆꢡ꣄ꢡꢵ
उत्तर्
ꢆꢛ꣄ꢗꢵ ꢥ꣄ꢫꢵꢫꢵꢭꢫꣁ
उञ्चा न्यायालया॑
ꢄꢗ꣄ꢗꢵ ꢦꢡ꣄ꢬꢸ
इच्चा पत्रु
ꢂꢥꢸꢪꢡꢶꢨꢶꢭ꣄ꢭꣁ / ꢨꢵꢣ꣄ꢫꢡꣁ
अनुमतिबिल्ला॑ / बाद्यता॑
ꢨꢵꢣ꣄ꢫꢡꣁ / ꢂꢤꢶꢒꢵꢬ꣄
बाद्यता॑ / अधिकार
ꢗꢵꢬꢠꣁ / ꢕꢹꢜꢗꢵꢬꢶ
चारणा॑ / घूटचारि
ꢒꢬ꣄ꢡꢮ꣄ / ꢒꢬ꣄ꢡꢮ꣄ꢫꣁ
कर्तव / कर्तव्या॑
ꢒꢵꢬꢵꢒꢵꢬ꣄ / ꢒꢵꢬꢵꢕꢾꢬ꣄ / ꢓꢾꢞꢶꢥꢸ ꢒꢵꢬꢵꢒꢵꢬ꣄
काराकार / काराघेर / ख॑डिनु काराकार
ꢕꢾꢥꢪ꣄
घ॑नम्
ꢣꣁꢳꢵꢪ꣄ ꢤꢹꢪ꣄
दा॑ळाम्धूम्
ꢒꢮꢵꢜ꣄ ꢚꢔꢶꢥꢶ / ꢨꢥ꣄ꢣ꣄
कवाट झगिनि / बन्द
ꢬꣃꢳꢶ / ꢒꢭꢔꢪ꣄
रौळि / कलगम्
ꢔꢭꢵꢜ꣄ꢜꢵ
कलाट्टा
ꢔꢵꢪ꣄ ꢥꢶꢱꢨ꣄ꢣꢸ ꢱꢵꢱꢥꣁ
गाम् निसब्दु सासना॑
ꢨ꣄ꢬꢰ꣄ꢜꢵꢗꢵꢬ꣄ / ꢪꢭꢶꢥꢵꢗꢵꢬ꣄
ब्रष्टाचार / मलिनाचार
ꢪꣁꢱꢒꢵꢬ꣄ / ꢲꣁꢖ꣄ꢔꢞ꣄ꢠꢵꢬ꣄
मोसकार / हा॑ङ्गडणार
ꢮꢶꢦꢒ꣄ꢰꢸꢮꢵꢥ꣄ / ꢡꣂꢒꢸꢦꢒ꣄ꢰꢸꢮꢵꢥ꣄
विपक्षुवान / तोकुपक्षुवान
ꢏꢡ꣄ꢡꢶ
आ॑त्ति
ꢭꢸꢒ꣄ꢙꢵꢥꢶ / ꢗꢵꢬ꣄
लुक्जानि / चार्
ꢒꢜ꣄ꢗꢶꢒꢾꢬꣁ / ꢦꢒ꣄ꢯꢸꢮꢵꢥ꣄
कट्चिक॑रा॑ / पक्षुवान
ꢗꢾꢡ꣄ꢡꢬ꣄
च॑त्तर्
ꢥꢿꢪꣁ
नेमा॑
ꢗꣁꢞ꣄ꢞꣁ
चा॑ड्डा॑
ꢱ꣄ꣁꢞ꣄ꢞꢶ
चा॑ड्डि
ꢢꢠꢵ ꢱ꣄ꢢꢭ ꢬꢒ꣄ꢰꢶꢥꢶ / ꢢꢠꢵ ꢬꢒ꣄ꢰꢶꢥꢶ
थणा स्थल रक्षिनि / थणारक्षिनि
ꢢꢠꢵ ꢮꢶꢩꢵꢔ꣄
थणा विभाग
ꢢꢠꢵ ꢱ꣄ꢢꢭ꣄
थणा स्थल्
ꢢꢠꣀꢡ꣄
थणैत
ꢒꢾꢭ꣄ꢭꢭ꣄
ख॑ल्लल्
ꢬꣃꢞꢶ
रौडि
ꢒꢸꢠ꣄ꢞꢸ
कुण्डु
ꢕꣁꢞꢵ ꢱꣀꢥ꣄ꢫꢸ
घा॑डा सैन्यु
ꢒꢸꢪ꣄ꢦꢸ
कुम्पु
ꢭꢸꢪ꣄ꢦ꣄ꢳꣁ
लुम्प्ळा॑
ꢂꢦꢬꢵꢤ꣄
अपराध
ꢂꢦꢬꢵꢕꢶ
अपराधि
ꢂꢮ꣄ꢞꢵ ꢮꢶꢗꢵꢬꢠꣁ
अव्डा विचारणा॑
ꢒꣀꢣꢶ / ꢨꢥ꣄ꢣꢶ / ꢒꢵꢬꢵ ꢔꢸꢦ꣄ꢡꣁ
कैदि / बन्दि / कारा गुप्ता॑
ꢒꣀꢣꢸ / ꢨꢥ꣄ꢣꢶꢒꢾꢬ꣄ꢥꢶ
कैदु / बन्दिक॑र्नि
ꢭꢾꢛ꣄ꢗꢪ꣄
लेञ्चम्
ꢒꢾꢭ꣄ꢭꢭ꣄ꢒꣁ
केल्लल्का॑
ꢪꣁꢬꢜꢱ꣄꣄ꢡꢾ
मा॑रटस्ते
ꢪꣁꢬꢞ꣄ꢠꢵꢬ꣄ / ꢲꢥ꣄ꢡꣁ / ꢕꢵꢡꢶ
मा॑रड्णार / हन्ता॑ / घाति
ꢒꢦꢜꢸ ꢓꢶꢛ꣄ꢗꢶꢥꢶ
कपटु खिञ्चिनि
ꢒꢦꢜꢸ ꢓꢶꢛ꣄ꢗꢸꢥꢵꢬ꣄
कपटु खिञ्चुनार
ꢒꢦꢜꢸ ꢓꢶꢛ꣄ꢗꢸꢥꢵꢬ꣄
कपटु खिञ्चुनार
ꢒꢸꢪ꣄ꢦꢸ
कुम्पु
ꢱꢵꢱꢥ ꢱꢖ꣄ꢒꢳꢥꣁ / ꢱꢵꢱꢥ ꢱꢖ꣄ꢒꢭꢥꣁ
सासन सङ्कळ्ना॑ / सासन सङ्कलना॑
ꢱꢵꢱꢥꣁ
सासना॑
ꢩꣁꢔꢸꢪꢵ
भा॑गुमान
ꢱꢵꢒ꣄ꢰꢶ
साक्षि
ꢦꢒ꣄ꢰꢸ / ꢱꢵꢣꢒꣁ
पक्षु / सादका॑
ꢱꢵꢭꢵ ꢮꢶꢤꢶꢥ꣄
साला विधिन
ꢦꢶꢱ꣄ꢒꢭ꣄ / ꢦꢸꢱ꣄ꢒꣁ
पिस्कल / बुस्का॑
ꢗꢶꢡ꣄ꢬ ꢮꢤꣁ
चित्रवधो
ꢒꢵꢬꢵꢕꢾꢬ꣄
काराघेर
ꢱꣂꢱꢥꣁ / ꢒꢸꢥꢸꢔꢶꢥꢶ
सोसना॑ / कुनुगिनि
ꢮꢶꢭꢹꢝ꣄ / ꢲꢥꢶꢪꢵꢬ꣄ / ꢮꢶꢭꢸꢝꢥꣁ
विलूठ / हनिमार / विलुठना॑
ꢃꢱ꣄ꢡꢶ / ꢱꣁꢡ꣄ꢡꢸ
आस्ति / सा॑त्तु
ꢡꢾꢒꢸꢬꢵꢭ꣄
त॑कुराल्
ꢬꢸꢙꢸ
रुजु
ꢢꢥꢵꢭ ꣄ꢭꣀꢞꢵ ꢲꢥ꣄ꢥꢶ
थणा ललैडा हन्नि
ꢲꢶꢨ꣄ꢨꢵꢞꢸ ꢃꢙꢛꣁ / ꢥꢶꢬꣂꢤ꣄ ꢃꢙ꣄ꢛꢸ
हिब्बाडु आजञो / निरोध आजञो
ꢣꢾꢠ꣄ꢞꢥꣁ
द॑ण्डना॑
ꢪꢥ꣄ꢡꢸ
मन्तु
ꢲꣂꢬ꣄
होर्
ꢱ꣄ꢮꢫ ꢬꢒ꣄ꢰꢠꣁ
स्वय रक्षणा॑
ꢗꣁꢬ꣄
चो्र
ꢗꣁꢞ꣄ꢞꢶ
चा॑ड्डि
ꢡꢷꢬ꣄ꢦꢸ / ꢠꢶꢬ꣄ꢠꢫꣁ
तीर्पु / निर्णया॑
ꢄꢔ꣄ꢬꢮꢵꢡꢶ
उग्रवाति
ꢭꢸꢒ꣄ ꢙꢥ꣄ꢥꢬ꣄
लुक्जन्नर
ꢱꢹꢗꢥꣁ / ꢜꢸꢦ꣄ꢦꢸ
सूचना॑ / तुप्पु
ꢣꣂꢬꢸ ꢣꢠ꣄ꢞꢵꢥꣁ
दोरु दण्डना॑
ꢲꣁꢬꢸꢒ꣄ꢬꢶꢫꣁ
होरुक्रिया॑
ꢱꢹꢗꢵꢭ꣄ / ꢗꣁꢒ꣄ ꢗꢭ꣄ꢥꢶ / ꢱꢡ꣄ ꢗꢭ꣄ꢥꢶ
सूचाल / चा॑क चल्नि / सत चल्नि
ꢥꢶꢮꢵꢬꢠꣁ
निवारणा॑
ꢥꢶꢫꢵꢮ꣄
नियाव्
ꢥꢷꢡꢶꢦꢡꢶ
नीतिपति
ꢥꢶꢫꢵꢫꢱ꣄ꢢꢭꣁ
नियायस्थला॑
ꢮꢶꢬꣂꢣ
विरोद
ꢒꢸꢣꣁ
कुदा॑
ꢩꣁꢔꢸꢪꢵꢥ꣄ / ꢦꢵꢬꢶꢡꣂꢱꢶꢒꣁ
भा॑गुमान / पारितोसिका॑
ꢦ꣄ꢬꢡꢶꢒꢹꢭ꣄
प्रतिकूल
ꢬꢒ꣄ꢯꢥꣁ
रक्षणा॑
ꢦꢶꢬꢡꢶꢮꢵꢣꢶ
पिरतिवादि
ꢱꢡ꣄ꢫꢦ꣄ꢬꢪꢵꢠ꣄ / ꢦꢶꢬꢪꢵꢠ꣄
सत्य प्रमाण् / पिरमाण्
ꢒꢸꢠ꣄ꢜꢸ / ꢪꢥ꣄ꢡꢸ
कुण्टु / मन्तु
ꢒ꣄ꢬꢵꢥ꣄ꢡꢶ
क्रान्ति
ꢒꢭꢲ ꢱ꣄ꢢꢶꢡꢶ
कलह स्थिति
ꢥꢒꢭ꣄
नकल
ꢪꣁꢬꢥꢸ ꢣꢠ꣄ꢞꢠꣁ
मा॑रनु दण्डणो
ꢦꣀꢭ ꢏꢫ꣄ꢣꢦꢥ꣄
फैल आ॑य्दपन
ꢪꣁꢬꢜꢸ
मा॑रटु
ꢤꢶꢒ꣄ꢒꢶꢥꢶ
धिक्किनि
ꢮꢵꢣꢸꢒꢾꢬ꣄ꢥꢵꢬ꣄ / ꢮꢵꢣꢸꢥꢵꢬ꣄
वादु क॑र्नार / वादुनार
ꢣꢵꢮꣁ
दावा॑
ꢮꢣꢶꢔ꣄ꢛꢵꢥꢶ / ꢮꢒ꣄ꢒꢷꢭ꣄
विदिगञानि / वक्कील
ꢆꢔ꣄ꢬ ꢒ꣄ꢬꢶꢫꣁ
उग्र क्रिया॑
ꢣꣂꢠꢸ ꢮꢵꢒ꣄ / ꢃꢣꢵꢬꢸ ꢮꢵꢗꢸ
दा॑णु वाक / आदारुवाचु
ꢮꢶꢮꢵꢣ꣄
विवाद
ꢮꢵꢣꢶ
वादि
ꢧꢶꢬ꣄ꢮ ꢓꢳ꣄ꢳꢱ꣄ꢡꢾ / ꢮꢵꢦꢱ꣄ ꢓꢳ꣄ꢳꢱ꣄ꢡꢾ
फिरिवि खल्लस्ते / वापस खल्लस्ते
ꢒꣀꢣꢸ ꢦꢡ꣄ꢬꣁ
कैदु पत्रा॑
ꢮꢶꢗꢵꢬꢠꣁ
विचारणा॑
ꢩꢬꢵꢜ ꣄ꢱꣁꢞ꣄ꢥꢶ
भराट् सा॑ड्नि
ꢥꢶꢫꢪꣁ
नियमा॑
ꢮꢶꢦꢡ꣄ꢡꢸ
विपत्तु
ꢮꢶꢬꣂꢤ꣄
विरोध्
ꢒꢸꢠ꣄ꢞꢸ
कुण्डु
ꢨꢥ꣄ꢤ꣄
बन्ध
ꢙꢪꢷꢥ꣄
जमीन


Script - Literature


ꢱꢵꢲꢶꢡ꣄ꢫꢸ
साहित्यु
ꢤꢬ꣄ꢪ ꢦꢸꢱ꣄ꢡꢮ꣄
धर्म पुस्तव
ꢤꢬ꣄ꢪꣁ
धर्मा॑
ꢱꢸꢮꢡ꣄ꢡꢵꢥ꣄ / ꢥꢷꢡꢶ ꢆꢒ꣄ꢡꢶꢥ꣄ / ꢗꣁꢒ꣄ ꢮꢵꢗꢸꢥ꣄ / ꢤꢾꢬꢸꢪꢸ ꢮꢡ꣄ꢡꢵꢥ꣄ / ꢲꢶꢡ ꢮꢵꢗꢸꢥ꣄
सुवत्तान / नीति उक्तिन / चा॑क्वाचुन / ध॑रुमु वत्तान / हित वाचुन
ꢄꢡꢶꢲꢵꢱ꣄
इतिहास
ꢱꢛ꣄ꢗꢭꢥꣁ
सञ्चलना॑
ꢂꢤ꣄ꢫꢵꢫ꣄
अध्याय
ꢕꢾꢬꢸ ꢤꢾꢬꢸꢪ꣄
घेरु ध॑रुम
ꢱꢵꢲꢶꢡ꣄ꢫꢱꢵꢱ꣄ꢡꢬ꣄ / ꢂꢭꢖ꣄ꢒꢵꢬꢸ ꢱꢵꢱ꣄ꢡꢬ꣄
साहिय सास्तर / अलङ्कारु सास्तर
ꢱꢵꢲꢶꢡ꣄ꢫꢸ
साहित्यु
ꢦ꣄ꢬꢾꢮ꣄ / ꢦ꣄ꢬꢾꢪꣁ
प्रेव / प्रेमा॑
ꢱꢾꢬ ꢤꢪꢶꢥꢶ / ꢱꢲ ꢦꢭꢵꢫꢥꣁ / ꢱꢲ ꢔꢪꢥꣁ
स॑र धमिनि / सह पलायना॑ / सह गमना॑
ꢮ꣄ꢫꢵꢓ꣄ꢫꢵꢥ꣄
व्याख्यान
ꢮꢗꢥ ꢱꣀꢭꢶ / ꢔꢣ꣄ꢫꣁ
वचन सैलि / गद्या॑
ꢡꢵꢞꢶꢦꢵꢥꢸꢥ꣄
ताडिपानुन
ꢮꢶꢫꢵꢱ꣄
वियास
ꢣꢾꢮꢸ ꢱ꣄ꢡꢶꢡꢶ
देवु स्तिति
ꢱꢶꢣ꣄ꢣꢵꢥ꣄ꢤꢸ ꢱꢣꢱ꣄
सिद्दान्धु सदस
ꢒꢮꢶ
कवि
ꢒꢮꢶꢡꣁ
कवितो
ꢗꢖ꣄ꢔꢪ꣄ / ꢪꢠ꣄ꢞꢭ꣄
चङगम् / मण्डल
ꢦ꣄ꢬꢾꢮꢸ ꢙꢶꢮ꣄ꢥꢪ꣄
प्रेवु जिव्नम
ꢤꢾꢬꢸꢪꢸ ꢙꢶꢮ꣄ꢥꢪ꣄
धेरुमु जिव्नम
ꢂꢤ꣄ꢫꢵꢫꢸ / ꢱꢬ꣄ꢔꢸ
अध्यायु / सर्गु
ꢪꢲꢵꢒꢵꢮ꣄ꢫꢸ
महाकाव्यु
ꢦꢶꢬꢵꢪꣁ / ꢄꢗ꣄ꢗꣁ / ꢃꢱ꣄ꢡꣁ / ꢦꢬꢷꢡꢶ / ꢒꢵꢪꣁ
पिरामा॑ / इच्चा॑ / आस्ता॑ / पिरीति / कामा॑
ꢦꣁꢮꢱꢸ ꢒꢵꢭ꣄
पा॑व्सु काल
ꢍꢱꢸ ꢮꢵꢜ꣄
एसुवाट्
ꢥꢵꢫꢒꢶ
नायकि
ꢥꢵꢫꢒꣁ
नायका॑
ꢱꢶꢱꢸꢱꢵꢄꢡ꣄ꢫꢸ
सिसुसाहित्यु
ꢦꣁꢱ꣄ꢪꢾ / ꢲꢾꢱ꣄ꢫꢪ꣄
पा॑स्म॑ / हेस्यम
ꢥꢵꢗꢸꢮꢵꢥ꣄
नाचुवान
ꢥꢵꢗꢸ
नाचु
ꢱꢶꢳ꣄ꢳꢵ ꢒꢵꢭ꣄ / ꢲꢶꢪꢳꣁ / ꢲꢶꢪꢸꢱꢸ ꢒꢵꢭ꣄
सिळ्ळा काल / हिमळा॑ / हिमुसु काल
ꢣꢵꢥ꣄
दान
ꢱꢪꢱ꣄ꢢꢵꢥ꣄
समस्थान्
ꢱꢪ꣄ꢒ꣄ꢯꢾꢦ꣄
सम्क्षेप
ꢡꢵꢣꢶ/ꢡꢵꢜꢶ - ꢦꢵꢥꢸ ꢭꢶꢓꢾꢫꣁ
ताडि/ ताटि - पानुम् लिख॑या॑
ꢦꢣ꣄ꢫꣁ
पद्या॑
ꢒꢮꢶꢡꢵ ꢬꢷꢡꢶ
कविता रीति
ꢯꣀꢮꣁ / ꢯꢶꢮ ꢪꢵꢬ꣄ꢔꢸ
शैवा॑ / शिवमार्गु
ꢮꢡ꣄ꢡꢵ ꢂꢬ꣄ꢢꢸ
वत्ता अर्थु
ꢦ꣄ꢬꢱꢖ꣄ꢔꢸ / ꢩꢵꢰꢠꣁ
प्रसङ्गु / भाषणा॑
ꢥꢵꢫꢒꢥ꣄
नायकन
ꢗꢭꢥ꣄ꢒꢵꢭ꣄ / ꢗꢭ꣄ꢡꢒꢵꢭ꣄
चलन्काल / चल्तकाल
ꢱ꣄ꢮ ꢗꢬꢶꢡ꣄ꢬꢸ
स्व चरित्रु
ꢂꢭꢔ꣄ ꢔꢷꢡꢸꢥ꣄
अलग गीतुन
ꢕꢾꢬꢸ ꢤꢾꢬꢸꢪ꣄
घेरु ध॑रुम
ꢣꣂꢰ ꢔꢸꢠ ꢮꢶꢪꢬ꣄ꢱꢠꣁ
दोष गुण विमर्सणा॑
ꢱꢥ꣄ꢫꢵꢱꢸ ꢂꢗꢵꢬ꣄
सन्यासु अचार
ꢣꢾꢒ꣄ꢯꢸꢠꢸ ꢮꢬꣁ / ꢪꢥ꣄ꢣ ꢪꢵꢬꢸꢣꣁ
द॑क्षुणु वरा॑ / मन्द मारुदा॑
ꢱꢖ꣄ꢒꢭꢥꢒꢬ꣄ꢡꣁ / ꢮ꣄ꢫꢵꢱ꣄ / ꢙꢾꢡꣁ ꢗꢾꢬ꣄ꢗꢸꢥꢵꢬ꣄ / ꢱꢪ꣄ꢦꢵꢢꢒꣁ
सङ्कलनकर्ता॑ / व्यास / ज॑ता॑ च॑र्चुनार / सम्पातका॑
ꢮꢬ꣄ꢠꢶ
वर्णि
ꢥꢵꢫꢥ꣄ꢪꢵꢬ꣄
नायन्मार्
ꢥꢶꢔꢠ꣄ꢜꢸ
निगण्टु
ꢤꢾꢬ꣄ꢪꢸ ꢓꢾꢥꢶ
ध॑र्मु ख॑नि
ꢥꢷꢡꢶ ꢱꢵꢲꢶꢡ꣄ꢫꢸ
नीति साहित्यु
ꢦꢸꢱ꣄ꢡꢮ꣄ / ꢦꣁꢡꢶ
पुस्तव / पा॑ति
ꢗꢡꢵꢨ꣄ꢣꢶꢶ
सताब्दि
ꢩꢒ꣄ꢡꢶ ꢪꢵꢬ꣄ꢔꢸ
भक्ति मार्गु
ꢩꢵꢔꢸ
भागु
ꢮꢡ꣄ꢡꢵꢥꢸ꣄ ꢂꢬ꣄ꢢꢸ
वत्ता अर्थु
ꢒꢮꢶꢡꣁ
कविता॑
ꢦꢬꢪꢵꢡ꣄ꢪꣁ
परमात्मा॑
ꢩꣁꢔꢸꢪꢵꢥ꣄
भा॑गुमान
ꢒꢮꢶꢡꣁ / ꢔꢷꢜ꣄
कविता॑ / गीत
ꢩꢮ꣄ꢡꢸꢭ꣄
भव्तुल
ꢧꣀꢭꢮꢵꢗꢸ / ꢦ꣄ꢬꢾꢮꢾꢱꢸ ꢮꢵꢗꢸ / ꢦꢷꢝꢶꢒꣁ
फैलवाचु / प्रेवेसु वाचु / पीठिका॑
ꢮꢳꢸ ꢬꢵꢠ꣄
वळुराण
ꢂꢭꢔ꣄ꢔꣁ / ꢮꢾꢔꢸꢳꣁ
अलग्गो / वेगुळा॑
ꢙꢥꢥꣁ
जनना॑
ꢙꢾꢥ꣄ꢪꢸ ꢧꣁꢳ꣄
ज॑न्मु फोळ्
ꢥꣁꢮꣁ ꢒꢮꢶꢡꣁ / ꢥꢮꢷꢥ ꢒꢮꢶꢡꣁ / ꢥꢹꢡꢥ ꢒꢮꢶꢡꣁ
ना॑वा॑ कविता॑ / नवीन कविता॑ / नूतन कविता॑
ꢕꢥꢮꢵꢥ꣄ / ꢦꣁꢰꢒꣁ
घनवान / पोषका॑
ꢦꢸꢬꢵꢠꢸ
पुराणु
ꢱꢹꢬꢶ / ꢒꢮꢶ
सूरि / कवि
ꢥꢾꢪ ꢱꣁꢞꢶꢥꢶ
नेम सा॑डिनि
ꢒꣃꢒꢶꢒ꣄
लैकिक्
ꢂꢪ꣄ꢪꢵꢥ꣄
अम्मान्
ꢱꢥ꣄ꢣꣁꢰ꣄
सन्देष्
ꢘꢥ꣄ꢣꢱ꣄ / ꢂꢬ꣄ꢢꢸ
छन्दस / अर्थु
ꢩꢵꢮꢬ꣄ꢢꢸ
भावार्थु
ꢫꢸꢣ꣄ꢤꢸ / ꢪꢵꢬ꣄
युद्धु / मार
ꢪꢴꣁꢞꢪ꣄
म्हा॑डम्
ꢦꢵꢬꢪ꣄ꢦꢬ꣄ꢫꣁ
पारम्परया॑
ꢦꢷꢔꢸ ꢤꢬꢷꢬ꣄
पीगु धारीर
ꢱꢪ꣄ꢱ꣄ꢡꢵꢥ꣄
सम्स्तान
ꢡꢸꢞ꣄ꢫꢵꢥꢸ ꢪꢵꢬ꣄ꢔꢸ
तुड्यानु मार्गु
ꢂꢮꢡꢵꢬꢶꢒꣁ
अवतारिका॑
ꢡꢷꢥ꣄ꢡꢪꢶꢳꢸ ꢱꢵꢲꢶꢡ꣄ꢫꣁ
थीन्तमिळु साहित्या॑
ꢪꢹꢭ ꢦꢸꢱ꣄ꢡꢮ꣄ / ꢂꢜꢸ ꢦꢸꢱ꣄ꢡꢮ꣄
मूल पुस्तव / अटुपुस्तव
ꢮꢥꢵꢥ꣄ꢡꢬꢸ ꢤꢬꢷꢬ꣄
वनान्तरु धरीर
ꢪꢸꢥꢶ
मुनि
ꢔꢥꢤꢥꢮꢵꢥ꣄
गनधनवान्
ꢆꢡ꣄ꢡꢬꢸ ꢮꢬꣁ / ꢲꢶꢪꢮꢬꣁ
उत्तरु वरा॑ / हिमवरा॑
ꢧꢾꢮ꣄ꢭꢥꢦꢥ꣄
फेव्नपन्
ꢒꢵꢪ꣄
काम्
ꢮꣀꢒꢸꢠ꣄ꢜꢸ / ꢦꢬꢪ꣄ꢤꢵꢪ꣄
वैकुण्टु / परम्धाम
ꢮꣀꢰ꣄ꢠꢮ ꢪꢵꢬ꣄ꢔꢸ
वैष्णव मार्गु




Script - Birth to Death


ꢱꣂꢞꢱ ꢱꢪ꣄ꢱ꣄ꢒꢵꢬꢸꢥ꣄
सोडस सम्स्कारुन
ꢂꢦꢱꢾꢔꢸꢥ꣄
अपस॑गुन
ꢂꢪꢖ꣄ꢒꢭꢸ / ꢪꢖ꣄ꢔꢭ ꢲꢶꢥ꣄
अमङ्गलु / मङ्गल हीन
ꢨꣁꢮ꣄ꢥꢶ ꢦꢡ꣄ꢬꢶꢒꣁ / ꢱ꣄ꢮꢵꢔꢡ ꢦꢡ꣄ꢬꢶꢒꣁ / ꢥꢶꢪꢥ꣄ꢡ꣄ꢬꢥ ꢦꢡ꣄ꢬꢶꢒꣁ
बा॑व्नि पत्रिका॑ / स्वागत पत्रिका॑ / निमन्त्रन पत्रिका॑
ꢨꣁꢮ꣄ꢥꢶ
बा॑व्नि
ꢂꢗꢵꢬ꣄
अचार्
ꢣꢷꢮꢥꣁ / ꢃꢱꢶꢬ꣄ꢮꢵꢣ꣄
दीवना॑ / आसिर्वाद
ꢆꢦꢮꢵꢱ꣄ / ꢏꢔꢡ꣄
उपवास / आ॑गत
ꢏꢬꢵꢡ꣄
आ॑रात्
ꢔꣁꢬꢸ ꢤꢾꢬ꣄ꢥꢶ
गा॑रु ध॑र्नि
ꢣꣁꢳꢵ ꢣꢶꢰ꣄ꢜꢶ / ꢣꢺꢰ꣄ꢜꢶ / ꢣꣁꢭ ꢦꣁꢞꢱ꣄ꢡꢾ
दा॑ळा दिष्टि / दृष्टि / दा॑ळ पा॑डस्त॑
ꢲꣁꢬꢵꢜ꣄ / ꢮꢶꢮꢵꢲꣁ / ꢦꢵꢠꢶ ꢔꢺꢲꢠꣁ
हा॑राट / विवाहा॑ / पाणि गृहणा॑
ꢙꣁꢮꢳ꣄꣄ / ꢒꢵꢥ꣄ ꢮꢶ/ꢪ ꢶꢥ꣄ꢡꢶꢥꢶ
वल / कन् वि/मि - न्दिनि
ꢪꢴꢹꢬ꣄ꢡꢸ ꢓꢵꢪ꣄ꢦꢸ ꢱ꣄ꢢꢵꢦꢥꣁ
म्हूर्तु खाम्पु स्थापना॑
ꢒꢸꢭ ꢮꣁꢕꢭꢱ꣄ꢡꢾ
कुल वा॑घलस्त॑
ꢚꢠ꣄ꢞꢮ꣄ ꢲꢶꢖ꣄ꢔꢞ꣄ꢠꢶ
झण्डाव्हिङ्गड्णि
ꢪꢸꢔ꣄ꢔꢸ
मुग्गु
ꢱꢾꢔꢸꢥ꣄
स॑गुन
ꢱꢪ꣄ꢱ꣄ꢒꢵꢬ꣄
सम्स्कार
ꢱꢶꢬ꣄ꢒ꣄ꢒꢠꢸ ꢂꢪ꣄ꢨꢶꢭ꣄
सिर्क्कणु अम्बिल्
ꢦ꣄ꢬꢿꢣꢸꢒ꣄ ꢔꢞ꣄ꢠꢶ
प्रेदुक गड्णि
ꢦ꣄ꢬꢾꢡ꣄ ꢢꣁꢮꢥ꣄ ꢱ꣄ꢢꢵꢥ꣄
प्रेत था॑वन स्थान
ꢦ꣄ꢬꢾꢣꢸꢦꣁꢭ꣄ꢭꢪ꣄ / ꢦ꣄ꢬꢾꢣꢸ ꢔꢬ꣄ꢡꣁ
प्रेदुपोल्लम / प्रेदु ग्र्तो
ꢦ꣄ꢬꢾꢣꢸꢦꢾꢞꢶ
प्रेदुप॑डि
ꢩꣁꢬꢠꢶ
भा॑ रणि
ꢱꢶꢥ꣄ꢣꢪ꣄
सिन्दम
ꢱꢶꢔ꣄ꢬꢪ꣄
सिग्रम
ꢦꣁꢭꣁ
प॑ला॑
ꢛꢵꢥꢱ꣄ꢥꢵꢥ꣄
ञानस्नान
ꢣꢲꢥꣁ
दहना॑
ꢡꢒ꣄ꢰ꣄ꢠꣁ
तक्ष्णा॑
ꢡꢪ꣄ꢦꢡꢶ
दम्पति
ꢭꢾꢗ꣄ꢗꢾ
ल॑च्च॑
ꢣꣁꢬꢶꢪ꣄ ꢨꣁꢜ꣄ꢜꢸ / ꢪꢵꢖ꣄ꢔꢭ꣄ꢫꢸ
दा॑रिम बा॑ट्टु / माङगल्यु
ꢨꣁꢜ꣄ꢜꢸ ꢩꢥ꣄ꢣꢶ
बा॑ट्टु भन्दि
ꢲꣁꢬꢵꢜꢸ ꢱꢶꢔ꣄ꢬꢪ꣄/ ꢲꣁꢬꢵꢜꢸ ꢩꣁꢔꢸꢪꢵꢥꢶ
हा॑राटु सिग्रम् / हा॑राटु भा॑गुमानि
ꢲꣁꢬꢵꢜ꣄
हा॑राट्
ꢲꣁꢬꢵꢜꢸ ꢪꢠ꣄ꢣꢦ꣄ (ꢪꣁꢠ꣄ꢡꢮ꣄)
हा॑राटुमण्डप् (मा॑ण्टव्)
ꢡꢶꢥ꣄ꢥꢵꢳ꣄꣄ / ꢱꢸꢦ ꢮꣀꢩꢮ꣄
तिन्नाळ / सुप वैभव
ꢱꢾꢥ꣄ꢥꢸ / ꢮꣀꢩꢮ꣄ / ꢡꢶꢥ꣄ꢥꢵꢳ꣄
स॑न्नु / वैभव / तिन्नाळ
ꢬꢾꢡ꣄ꢡꢸꢱꢾꢥ꣄ꢥꢸ
र॑त्तुस॑न्नु
ꢩꢶꢠ꣄ꢞꢶꢥꢶ / ꢥꣁꢪ꣄ꢒꢾ
भिण्डिनि / नोम्के
ꢱ꣄ꢮꢵꢔꢡꣁ
स्वागतो
ꢡꢸꢜ꣄ꢫꢵꢥꢸ ꢲꣁꢬꢵꢜ꣄
तुट्यानुहा॑राट्
ꢕꢾꢜ꣄ꢜꢶꢮꢶꢞꣁ
ग॑ट्टिविडा॑
ꢣꢿꢱ꣄
देस्
ꢨꢠꢵꢭ꣄ / ꢦꣁꢜ꣄ꢜꢵꢱ꣄
बणाल् / पा॑ट्टास्
ꢱꢾꢥ꣄ꢥꢸ
स॑न्नु
ꢒꢭꢵꢗꢵꢬ꣄ / ꢱꢪ꣄ꢱ꣄ꢒꢺꢡꢶ
कलाचार / सम्स्कृति
ꢪꢮ꣄ꢞꣁ
मव्डा॑
ꢦꢵꢡꢶ / ꢦꢖ꣄ꢒ꣄ꢡꢶ
पादि / पङ्क्ति
ꢩꣁꢔꢸꢪꢵꢥ꣄
भा॑गुमान्
ꢨꣁꢭꢶ
बा॑लि
ꢬꣂꢙꢵ ꢧꢹꢭꢸꢦꢥꢶ
रोजा फूलुपनि
ꢦꢥ꣄ꢥꢷꢬ꣄ ꢓꢸꢪ꣄ꢨꢵꢮ꣄
पन्नीर खुम्बाव
ꢦꢵꢞꣁ
पाडा॑
ꢣꢹꢡ ꣄ꢲꢸꢥ꣄ꢥꣁ ꢒꢾꢬꢱ꣄ꢡꢾ / ꢣꢹꢡ꣄ ꢡꢮꢱ꣄ꢡꢾ
दूत हुन्ना॑ केरस्ते / दूत्तवस्ते
ꢦꢶꢠ꣄ꢞꢸ
पिण्डु
ꢆꢙꢾꢣꢶꢮꢱ꣄ / ꢆꢙꢾ ꢣꢶꢥ꣄ꢥꢸ
उज॑ दिवस / उज॑ दिन्नु
ꢧꢹꢭꢸ ꢪꢸꢔ꣄ꢔꢸ
फूलुमुग्गु
ꢔꢺꢲ ꢦ꣄ꢬꢮꢿꢱ꣄
गृह प्रवेस
ꢦꢸꢬꣁꢲꢶꢡ꣄ / ꢦꢸꢬꢾꢡ꣄
पुरोहित / पुरेत
ꢦꢸꢙꢬꢶ
पुजरि
ꢗꢵꢭꢸ ꢮꢶꢱꢾꢯ꣄
चालु विसेष
ꢨꢾꢜ꣄ꢒꢶ ꢱꢵꢱ꣄ꢡꢾ
ब॑ट्कि सास्ते
ꢥꢵꢪꢔꢬꢠꣁ / ꢱꢾꢜ꣄ꢜꢶ
नामगरणा॑ / स॑ट्टि
ꢲꣁꢬꢵꢜꢸꢪꢮ꣄ꢞꣁ
हा॑राटु मव्डा॑
ꢥꣁꢮ꣄ꢬꢶ
ना॑व्रि
ꢥꣁꢮ꣄ꢬꣁ
ना॑व्रा॑
ꢲꣁꢬꢵꢜꢸ ꢲꢵꢬ
हा॑राटु हार
ꢲꣁꢬꢵꢜꢸ ꢦꢷꢝꢪ꣄
हा॑राटु पीठम्
ꢦꢣ꣄ꢣꢣꢶ / ꢮꢡ꣄ꢒꢾ
पद्दति / वक॑
ꢦꢸꢥꢬ꣄ꢙꢾꢥ꣄ꢪꢸ
पुनर्ज॑न्मु
ꢦꢷꢞꢸꢪꢸꢔ꣄ꢔꢸ
पीडुमुग्गु
ꢲꢵꢬ꣄ꢧꢶꢬꢶꢕꢭ꣄ꢭꢶꢥꢶ / ꢪꢵꢭꣁ ꢪꢗ꣄ꢗꢸꢭꢱ꣄ꢡꢾ
हार्फिरिघल्लिनि / माला॑ मच्चुलस्ते
ꢦꢵꢄ~ ꢪꢸꢣ꣄ꢣꢶ / ꢮꢶꢛ꣄ꢗꢸ ꢨꣁꢜ꣄ꢜꢸ
पाइ~ मुद्दि / विञ्चु बा॑ट्टु
ꢒꢾꢥ꣄ꢥꢭ꣄
क॑न्नल
ꢪꢸꢣ꣄ꢣꢶꢪꢬ꣄ꢗꢸꢭꢱ꣄ꢡꢾ
मुद्दि मर्चुलस्ते
ꢪꢴꢹꢬ꣄ꢡꢸ / ꢭꢾꢔꢶꢥ꣄
म्हूर्तु / ल॑गिन
ꢪꢴꢸꢞꢨꢶꢠ꣄ꢞꢶꢥꢶ
म्हुडा बिण्डिनि
ꢱ꣄ꢮꢵꢔꢣ꣄
स्वागद
ꢒꣀꢥꣁ ꢧꢶꢬꢞ꣄ꢥꢶ
कैना॑ फिरड्नि
ꢡꢥ꣄ꢣꢸ ꢡꣀꢥꢶ
तन्दु तैनि
ꢥꢥ꣄ꢣꢶꢥꢶ
नन्दिनि
ꢙꣁꢪꢥ꣄
जा॑मन्
ꢮꣀꢩꢮ꣄
वैभव्
ꢔꣁꢬꢸ ꢆꢞ꣄ꢔꢠ꣄ꢠꢶ
गा॑रु उड्गण्णि
ꢙꢬ꣄/ꢡ꣄ꢒꢾꢪ꣄ ꢦꢵꢥ꣄
जर/त्क॑म्पान


Script - Measure


ꢪꣂꢮꢸꢥ꣄ / ꢪꢶꢡꢶꢥ꣄
मोव्न / मितिन
ꢦꢾꢱꢵꢮ꣄ (ꢒꢜ꣄ꢜꢶꢜꢪ)꣄ / ꢬꢸꢥ꣄ꢡꢶ (ꢡꢸꢠꢶ)
प॑साव (कट्टिटम) रुन्ति (तुणि)
ꢨꣂꢜ꣄
बा॑ट्
ꢂꢞꢶ
अडि
ꢪꣂꢦꢸ
मोवु
ꢪꣂꢦꢸ ꢓꢜ꣄ꢜꢶ
मोवुखट्टि
ꢂꢬꣁ
अरा॑
ꢥꢶꢪ꣄ꢥꣁ / ꢭꣁꢡ꣄
निम्ना॑ / लोत
ꢂꢜ꣄ꢥꣁ
अट्ना॑
ꢲꢡ꣄ꢣꢞ꣄ꢞꣁ
हत्दड्डा॑
ꢒꢵꢭꢞ꣄ꢞꣁ / ꢱꣂꢮꢸ
कालड्डा॑ / चोवु
ꢩꢵꢬ꣄ꢪꣂꢮꢸ
भार्मोवु
ꢙꣂꢒ꣄
जोक
ꢪꣁꢮ꣄ꢙꢥ꣄ꢪꣂꢮꢸ
मा॑व्जन्मोवु
ꢆꢦꢒꢬꢠꣁ
उपकरणा॑
ꢔꢥꢪꣂꢦꢸ
गनमोपु
ꢩꢵꢬ꣄
भार्
ꢔꢾꢙ꣄ꢙꢸ
ग॑ज्जु
ꢂꢮ꣄ꢞ ꢪꣂꢮꢸ
अव्डमोवु
ꢗꢡ꣄ꢬꢸꢭ꣄ ꢪꣂꢮꢸ
चत्रुल्मोपु
ꢙꢵꢠ꣄
जाण्
ꢗꢶꢪ꣄ꢜꣁ
चिटा॑
ꢦꢬꢶꢡꢶ / ꢒꢸꢠ꣄ꢮꢫ ꢪꣂꢮꢸ
परिति / कुण्वयमोवु
ꢡꢸꢭꣁ / ꢥꢬꢵꢙꢶ
तुला॑ / नराजि
ꢒꢸꢜ꣄ꢒꣁ
कुट्का॑
ꢨꢶꢥ꣄ꢣꢸ
बिन्दु
ꢡꣁꢭꣁ
ता॑ळा॑
ꢥꢵꢳꢶ
नाळि
ꢩꢵꢬ꣄ ꢪꣂꢮꢸ
भार्मोवु
ꢭꢵꢪ꣄ ꢪꣂꢮꢶ
लाम्मोवु
ꢪꢹꢬꣁ
मूरा॑
ꢂꢞ꣄ꢞꣁ
अड्डा॑
ꢮꢜꣁ
वटू
ꢂꢞ꣄ꢞꣁ
अड्डा॑
ꢥꢾꢬ꣄ꢦꢾꢪꣂꢮꢸ
न॑र्प॑मोवु
ꢦꢭꢪ꣄
पलम
ꢂꢣ꣄ꢣꢾ
हद्दे
ꢪꢹꢣ꣄ / ꢪꢹꢞ꣄ꢩꣂꢬ꣄
मूड् / मूड्बोऱ
ꢪꢬꢒ꣄ꢒꢵꢭ꣄
मरक्काल
ꢪꢹꢬꣁ
मूरा॑
ꢪꢷꢜ꣄ꢜꢬ꣄
मीट्टर्
ꢪꢶꢛ꣄ꢗꢶ ꢪꣁꢮꢸ
मिञ्चिमोवु
ꢪꣁꢳꢪꢸ (ꢓꢜ꣄ꢜꢶ) ꢮꢳ꣄꣄ꢜꢶ / ꢪꢹꢬꢵ ꢒꢮ꣄ꢠ꣄ꢞꢶ
मा॑ळमु (खट्टि) वळ्टि / मूरा कव्ण्डि
ꢪꣁꢳꢪ꣄ / ꢲꢵꢡ꣄
मा॑ळम / हात
ꢂꢮ꣄ꢞꢵꢪꣁꢮꢸ / ꢮ꣄ꢫꢵꢱ꣄
अव्डामोवु / व्यास
ꢮꢶꢱꢶ
विसि
ꢡꢵꢦ꣄ꢱꢥꢶ / ꢡꢵꢦ꣄ꢪꢵꢥꢶ
ताप्सनि / ताप्मानि
ꢱꢾꢬ꣄ꢒꣁ
सेर्का॑
ꢙꣂꢞꢶ
जा॑डि


Script - Metals




ꢭꣁꢲꢸꢥ꣄
25.லோஹுன்
ꢙꢾꢭ꣄ꢪꢶꢥ꣄
ஜெல்மின்
ꢭꢴꣁꢔꢠ꣄
லொ:க3ண்
ꢒꢾꢱ꣄ꢡꢸꢭ꣄
கெஸ்துல்
ꢭꣂꢲꢸ
லோஹு
ꢦꢛ꣄ꢗꢭꣂꢲꢸ
பஞ்சலோஹு
ꢂꢣ꣄ꢣꢪ꣄ / ꢲꢦꢵꢥ꣄ / ꢣꢮ꣄ꢥꣁ / ꢪꢸꢒ꣄ꢬꣁ
அத்3த3ம்/ஹபாள்/ த3வ்னொ/முக்ரொ
ꢔꢵꢥ꣄ꢡꢪ꣄
கா3ந்தம்
ꢡꢪ꣄ꢨꢾ / ꢡꢪ꣄ꢨꢸꢬꢪ꣄
தம்பெ3/தம்பு3ரம்
ꢡꢭ꣄ / ꢡꢾꢒꢜ꣄
தவ்/தெக3ட்
ꢱꣁꢥ꣄ꢥꣁ / ꢱꣁꢬ꣄ꢠꢸ / ꢂꢦ꣄ꢬꢛ꣄ꢙꢶ
ஸொன்னொ/ ஸொர்ணு/அப்ரஞ்ஜி
ꢡꢸꢡ꣄ꢡꢥꢵꢔ꣄
துத்தநாக்3
ꢥꢵꢔ꣄
நாக்3
ꢭꢷꢡꢸ
லீது
ꢒꢱꣁ
கஸொ
ꢬꢸꢦ꣄ꢦꣁ
ருப்பொ


Script - Music


ꢱꢖ꣄ꢔꢷꢡ꣄ ꢒꢶꢥꢸ ꢒꢭꢵꢗꢵꢬꢸ ꢱꣁꢥ꣄ꢡꢸꢥ꣄
सङ्गीत किनु कलाचारु सा॑न्तुन
ꢪꢛ꣄ꢗꢸ
मञ्चु
ꢧꣀꢭ ꢦ꣄ꢬꢣꢬ꣄ꢰꢥꣁ
फैल प्रदर्षना॑
ꢲꢬꢶꢓꢾꢡꣁ
हरिख॑ता॑
ꢦꢸꢬꢵꢡꢥꢮꢱ꣄ꢡꢸ ꢦ꣄ꢬꢣꢬ꣄ꢰꢶꢥꢶ
पुरातन वस्तु प्रदर्षिनि
ꢥꢵꢗꢸ / ꢥꢜꢥꢪ꣄
नाचु / नटनम
ꢱꢖ꣄ꢔꢷꢡ꣄
सङगीत्
ꢱꢖ꣄ꢔꢷꢡꢸ ꢮꣀꢩꢮ꣄
सङगीतु वैभव
ꢱꢶꢖ꣄ꢒꢵꢬ꣄ꢭꢶꢥꢶ
सिङकार्लिनि
ꢍꢒꢵꢖ꣄ꢒꢶ ꢥꢜ꣄ꢒꢪ꣄
एकाङ्कि नट्कम
ꢱꢨ꣄ꢣꢸ ꢦ꣄ꢬꢒꢵꢱꢸ ꢣꢬ꣄ꢰꢥꣁ
सब्दुप्रकाषु दर्षना॑
ꢤꣁꢥꢶ ꢦꢛ꣄ꢙꢷꢒꢬꢠꣁ
धोनि पञ्जीकरणा॑
ꢱꢨ꣄ꢣꢸꢔꢸꢠ꣄ꢮꢶ
सब्दु गुण्वि
ꢗꢶꢡ꣄ꢬꢸ
चित्रु
ꢱꢖ꣄ꢔꢷꢡ ꢮꣀꢩꢮ꣄
सङ्गीत वैभव
ꢒꢷꢡꢸꢱ꣄ꢬꢸꢡꢶ / ꢔꢮ꣄ꢥꢶꢱ꣄ꢢꢵꢥ꣄ / ꢱ꣄ꢡꢵꢥꢦ꣄ꢬꢫꢡ꣄ꢥꣁ
गीतुस्रुति / गव्निस थान / स्तानप्रयत्ना॑
ꢪꣂꢜꢶ ꢮꢶꢡ꣄ꢡꢾ
मोटिवित्त॑
ꢒꢭꢵ
कला
ꢒꢭꢵꢒꢵꢬ꣄
कलाकार्
ꢒꢵꢒ꣄ꢰꢶ
काक्षि
ꢔ꣄ꢬꢵꢪꢶꢫ ꢥꢵꢗꢸ
ग्रामिय नाचु
ꢙꢾꢡꣁꢪꢶꢳꢶ ꢓꢳꢥ꣄ꢥꢵꢗꢸ
जेतोमिळि खळन्नाचु
ꢪꢭ꣄ꢭꢫꢸꢣ꣄ꢣꢸ
मल्लयुद्दु
ꢥꢵꢗꢸ
नाचु
ꢥꢵꢗꢸ ꢓꣁꢜ꣄ꢜꣁ
नाचुखा॑ट्टा॑
ꢗꢶꢡ꣄ꢬ ꢮꢷꢠꢾ
चित्रवीणा॑
ꢮꢶꢤꢹꢰꢒ꣄
विधूषक्
ꢒꣁꢭꢸ ꢓꢵꢭ꣄
कोलु खाल्
ꢱꢖ꣄ꢔꢷꢡ꣄
सङ्गीत्
ꢱꢸꢕꢞꢶ / ꢕꢞꢶ ꢆꢜꢵꢮ꣄
सुघडि / घडि उटाव
ꢗꢶꢡ꣄ꢬꢸ
चित्रु
ꢗꢾꢠ꣄ꢜꢾ
च॑ण्ट॑
ꢡꢫꢵꢬ꣄ ꢒꢾꢬ꣄ꢥꢵꢬ꣄
तयार क॑र्नार
ꢡꢫꢵꢬ꣄ꢒꢾꢬ꣄ꢥꢶ
तयार्क॑र्नि
ꢱ꣄ꢮꢩꢵꢰꢥ꣄ ꢍꢒꢵꢥ꣄ꢡꢸ ꢮꢗꢸ
स्वभाषण् / एकान्तु वाचु
ꢡꢵꢳꢸ
ताळु
ꢦꢞꢸꢣꣁ / ꢡꢶꢬꢱ꣄ꢒꢾꢬ꣄ꢥꢵꢮ꣄
पडुदा॑ / तिरस्क॑र्नाव
ꢡꢾꢬꢵ ꢭꣁꢱ꣄
त॑रा लोस
ꢥꢵꢗꢸ ꢓꣁꢜ꣄ꢜꣁ
नाचु खा॑ट्टा॑
ꢲꢵꢱ꣄ꢫꢪ꣄
हास्यम
ꢥꢜ꣄ꢭꣁ
नाचु
ꢥꢜ꣄ꢮꣁ / ꢥꢜꣁ
नट्वा॑ / नटा॑
ꢥꢜ꣄ꢮꢶ / ꢥꢜꢶ
नट्वि / नटि
ꢥꢗꢶꢥꢶ
नचिनि
ꢓꢳ꣄꣄ꢥꢶ ꢥꢵꢗꢸ
खळ्नि नाचु
ꢥꢗꢥ ꣄ꢥꢵꢗꢸ / ꢥꢜꢥ ꢥꢵꢗꢸ
नचन्नाचु / नटन नाचु
ꢥꢵꢗꢸ
नाचु
ꢥꢵꢣꢸ
नादु
ꢥꢱꢸꢬꢵꢭ꣄
नसुराल्
ꢥꢷꢞꢵ ꢭꣂꢱ꣄
नीडा लोस
ꢭꢭꢶꢡ ꢒꢭꣁ
ललित कला॑
ꢮꢶꢮꢵꢣꢸ ꢱꢣꢱ꣄
विवादु सदस्
ꢩꢬꢡ ꢥꢵꢜ꣄ꢫꣁ
भरत नाट्या॑
ꢪꢸꢭ꣄ꢭꢮꢶ
मुल्लवि
ꢩꢮ꣄ꢣꢸꢭ꣄
भव्दुल्
ꢔꢷꢜ꣄
गीत्
ꢔꢮ꣄ꢥ ꢶꢮꣀꢩꢮ꣄ / ꢔꢷꢡꢸ ꢮꣀꢩꢮ꣄
गव्नि वैभव / गीतु वैफैव्
ꢔꢮ꣄ꢥꢵꢬ꣄
गव्नार्
ꢔꢮ꣄ꢥꢵꢬ꣄
गव्नार्
ꢔꢷꢡꢶ
गीति
ꢱꢥꢵꢬ꣄
सनार्
ꢮꢫꢭꢶꢥ꣄
वयलिन्
ꢥꢷꢞꢵ ꢭꣂꢱ
नीडा लोस
ꢮꢿꢠꢸ
वेणु
ꢮꢱ꣄ꢡꢸ ꢦ꣄ꢬꢡꢬ꣄ꢰꢶꢠꢷ
वस्तु प्रतर्षिणि
ꢒꢵꢭꢒ꣄ꢰꢿꢦꢸ / ꢣꢶꢥ꣄ꢥꢸ ꢔꢪ꣄ꢞꢶꢥꢶ
कालक्षेपु / दिन्नु गम्डिनि
ꢣꣂꢠ꣄ꢞꣁ
धोण्डा॑
ꢪꢭ꣄ꢫꢸꢣ꣄ꢣꢸ
मल्युद्दु
ꢪꢾꢣ꣄ꢣꢳ꣄
मेद्दळ
ꢥꢔꢬꣁ
नगरा॑
ꢭꢕꢸ ꢱꢖ꣄ꢔꢷꢡ꣄
लघु सङ्गीत
ꢪꢛ꣄ꢗ꣄
मञ्च्
ꢗꢾꢥ꣄ꢣꢸꢬ꣄ ꢬꢴꢾꢜꣁ
चेन्दुर् र्ह॑टा॑
ꢬꢱꢶꢒꣁ
रसिका॑
ꢬꢱꢶꢒꣁ
रसिका॑
ꢬꢵꢔ꣄
राग
ꢮꢗꢥ꣄
वचन्
ꢨꢠꢵꢭꢸ ꢮꢾꢞꢶꢒ꣄
बणालु व॑डिक
ꢮꢮ꣄ꢙꢶꢥꢶ ꢮꢵꢣ꣄ꢫꣁ
वव्जिनि वाद्या॑
ꢂꢒꢵꢱꢸ ꢤ꣄꣄ꢮꢥꢶ
अकासु ध्वनि
ꢮꢶꢡ꣄ꢡꢾ
वित्त॑
ꢱꢾꢥ꣄ꢡꢸ
स॑न्तु
ꢮꢷꢠꢾ
वीणा॑
ꢮꢾꢞꢶꢒ꣄ / ꢓꢿꢳ꣄꣄ / ꢓꢾꢭ꣄ꢭꢭ꣄
व॑डिक् / खेळ / खेल्लल
ꢱ꣄ꢮꢬꣁ
स्वरा॑


Script - Ordinals

ꢱꢖ꣄ꢓ꣄ꢫꢵꢥ꣄
सङख्यान
ꢔꢠꢥ ꢱꢖ꣄ꢓ꣄ꢫꢵꢥ꣄
गणन सङख्यान
ꢲꢣ꣄ꢣꢸ
हद्दु
ꢂꢬ꣄ꢒ꣄ꢫꢵꢭ꣄
अर्क्याल
ꢂꢖ꣄ꢒꢾ
अङ्का॑
ꢱꢖ꣄ꢓ꣄ꢫꣁ
सङ्ख्यो
ꢱꣂꢮꢸ
सा॑वु
ꢒꢳꣁ / ꢮꢷꢱꢪꢞ꣄ꢜꣁ
कळा॑ / वीसमड्डा॑
ꢡꢶꢮ
तिव
ꢱꢶꢭꢶ / ꢱꢣ꣄ꢣꢸꢮꢶꢱꢪ꣄
सिलि / सद्दुविसम्
ꢱꢸꢥ꣄ꢫ
सून्य
ꢱꢸꢥ꣄ꢥꢸ
सुन्नु
ꢫꣂꢔ꣄
योग्
ꢣꢷ
दी
ꢣꢷꢥꢸ
दीनु
ꢗꢵꢬꢸ
चारु
ꢦꢵꢛ꣄ꢗ꣄
पाञ्च्
ꢱꣂ
सो
ꢱꢵꢢ꣄
साथ्
ꢃꢝ꣄
आठ्
ꢥꣁꢮ꣄
ना॑व्
ꢣꢾꢱ꣄
द॑स्
ꢮꢶꢒ꣄ꢫꢵꢬ꣄
विक्यार्
ꢨꢵꢬ꣄
बार्
ꢡꢿꢬ꣄
तेर्
ꢗꣁꢮꢣ꣄
चा॑व्द्
ꢧꢥ꣄ꢣꢬ꣄
फ्न्दर्
ꢱꣁꢮꢳ꣄
सा॑वळ
ꢱꢡ꣄ꢡꢬ꣄
सत्तर्
ꢂꢝꢵꢬ꣄
अठार्
ꢏꢒ꣄ꢥꢷꢱ꣄
आ॑क्नीस्
ꢮꢷꢱ꣄
वीस्
ꢡꢷꢱ꣄
तीस्
ꢣꢷꢒꢳꢡꢷꢱ꣄
दीकळतीस्
ꢗꢳꢶꢱ꣄
चळिस्
ꢢꢷꢥ꣄ꢒꢳ ꢗꢳꢶꢱ꣄
थिन्कळ चळिस्
ꢦꣁꢥ꣄ꢥꢵꢱ꣄
पा॑न्नास्
ꢗꢵꢬ꣄ꢒꢳ ꢦꣁꢥ꣄ꢥꢵꢱ꣄
चार्कळ पा॑न्नास्
ꢱꢵꢜ꣄
साट्
ꢦꢵꢛ꣄ꢗꢳ ꢱꢵꢜ꣄
पाञ्सळसाट्
ꢱꢷꢬ꣄
सीर्
ꢱꣂꢒꢳ ꢱꢷꢬ꣄
सोकळसीर्
ꢂꢱꢶ
असि
ꢱꢵꢡ꣄ꢒꢳ ꢂꢱꢶ
सात्कळअसि
ꢥꢮꢡ꣄
नवत्
ꢃꢜ꣄ꢒꢳ ꢥꢮꢡ꣄
आट्कळ नवत्
ꢥꣁꢮ꣄ꢮꢳ ꢥꢮꢡ꣄
नोव्वअ नवत्
ꢱꣂꢮꢸ
सोवु
ꢫꣂꢒꢭ ꢱꣂꢮꢸ
योकळसोवु
ꢣꢷꢒꢳ ꢱꣂꢮꢸ
दीकलसोवु
ꢣꢷꢱꣂꢮꢸ
दीसोवु
ꢢꢷꢥ꣄ꢱꣂꢮꢸ
थीन्सोवु
ꢗꢵꢬ꣄ꢱꣂꢮꢸ
चार्सोवु
ꢦꢵꢛ꣄ꢗ꣄ ꢱꣂꢮꢸ
पाञ्सोवु
ꢱꣂ ꢱꣂꢮꢸ
सोसोवु
ꢱꢵꢡ꣄ ꢱꣂꢮꢸ
सात्सोवु
ꢃꢝ꣄ꢱꣂꢮꢸ
आठ्सोवु
ꢥꣁꢮ꣄ ꢱꣂꢮꢸ
ना॑वसोवु
ꢥꣁꢭ꣄ꢒꢳ ꢥꣁꢮ꣄ꢱꣂꢮꢸ
ना॑ल्कळ नोव्सोवु
ꢱꢱꢬꢸ
ससरु
ꢣꢷꢒꢳ ꢱꢱꢬꢸ
दीकळ ससरु
ꢮꢷꢱ꣄ꢒꢳ ꢱꢱꢬꢸ
विस्कळ ससरु
ꢣꢷꢱꢵꢬ꣄
दीसार्
ꢢꢶꢥ꣄ꢱꢵꢬ꣄
थिनसार्
ꢗꢵꢬ꣄ ꢱꢵꢬ꣄
चार्सार्
ꢦꢵꢛ꣄ꢗ꣄ ꢱꢱꢬ꣄
पाञच्सार्
ꢱꣂ ꢱꢵꢱꢬ꣄
सो ससर्
ꢱꢵꢡ꣄ ꢱꢱꢬ꣄
साट्ससर्
ꢃꢜ꣄ ꢱꢱꢬ꣄
आट्ससर्
ꢥꣁꢮ꣄ ꢱꢱꢬ꣄
ना॑व्ससर्
ꢣꢾꢱ꣄ ꢱꢱꢬ꣄
द॑स्ससर्
ꢭꢾꢒ꣄ꢒꢸ
ल॑क्कु
ꢱꣁꢮꢸ ꢱꢱꢬꢸ
सा॑वु ससरु
ꢒꣂꢜꢶ
कोटि
ꢏꢠ꣄ꢜꢾ
आ॑ण्ट॑
ꢏꢠ꣄ꢜꢾ
आ॑ण्ट॑
ꢧꣀꢭꣁ
फैला॑
ꢧꣀꢭꢵꢪ꣄
फैलाम्
ꢣꢶꢮ꣄ꢮꣁ
दिव्वा॑
ꢣꢶꢮꢫꣁ
दिवया॑
ꢢꢶꢥ꣄ꢱꢵ
थिन्सा
ꢣꢶꢥ꣄ꢮꢫꣁ
दिन्वया॑
ꢗꢬ꣄ꢭꣁ
चर्ला॑
ꢗꢬ꣄ꢮꢫꣁ
चर्वया॑
ꢦꢮ꣄ꢛ꣄ꢗꣁ
पवञ्चो
ꢦꢮ꣄ꢛ꣄ꢗꣁꢫꣁ
पवञ्चा॑या॑
ꢱꣁꢮ꣄ꢮꣁ
सा॑व्वा॑
ꢱꣁꢮ꣄ꢮꢫꣁ
सा॑व्वया॑
ꢱꢡ꣄ꢭꣁ
सत्ला॑
ꢱꢡ꣄ꢮꢫꣁ
सत्वया॑
ꢂꢜ꣄ꢮ
अट्व
ꢂꢜ꣄ꢮꢫꣁ
अट्वया॑
ꢥꣁꢮ꣄ꢮ
ना॑व्व
ꢥꣁꢮ꣄ꢮꢫꣁ
ना॑व्वया॑
ꢣꢾꢱ꣄
द॑स
ꢣꢾꢱ꣄ꢮꢫꣁ
द॑स्वया॑


Script - Physical Appearance


ꢯꢾꢬꢷꢬ꣄ ꢒꢶꢥꢸ ꢯꢾꢬꢶꢬꢸ ꢮꢶꢒꢵꢬꢸꢥ꣄
श॑रीर किनु श॑रीरु विकारुन
ꢂꢖ꣄ꢔꢮꢶꢒꢵꢬꢸꢥ꣄ / ꢯꢵꢬꢷꢬꢶꢒ ꢮꢶꢒꢵꢬꢸꢥ꣄
अङ्गविकारुन / सारीरिक विकारुन
ꢂꢖ꣄ꢔꢲꢷꢥꢸ / ꢯꢵꢬꢷꢬꢶꢒ / ꢂꢰ꣄ꢒꢡꢡ
अङ्गहीनु / शारीरिक / अष्कतत
ꢂꢖ꣄ꢔꢲꢷꢥꢸꢥ꣄ / ꢥꢹꢥꢯꢬꢷꢬꢶ
अङ्गहीनुन् / नूनुशरीरि
ꢪꢹꢒꣁ / ꢪꢹꢓꣁ
मूका॑ / मूखा॑
ꢪꢹꢒꢶ
मूकि
ꢏꢬꣁꢣꣁꢭꣁꢮꢵꢥ꣄ / ꢏꢬꣁꢣꣁꢭꢶꢮꢵꢥ꣄
ओरोदोलोवान / ओरोदोलिवान
ꢏꢬꣁꢣꣁꢭꢶ
ओरोदोलि
ꢫꣁꢒ꣄ ꢣꣁꢭꢮꢵꢥ꣄
योकदोलवान
ꢗꢾꢮꢸꢜ꣄ / ꢌꢞꣁ
च॑वुट् / ए॑डा॑
ꢂꢒ꣄ꢒꢸꢬꣁ / ꢒꢸꢳ꣄ꢳꣁ
अक्कुरा॑ / कुळ्ळा॑
ꢒꢸꢳ꣄ꢳ꣄ꢶ / ꢂꢒ꣄ꢒꢸꢬꢷ
कुळ्ळि / अक्कुरी
ꢂꢥ꣄ꢣꢒꣁ / ꢔꢸꢜ꣄ꢞꢾ
अन्दका॑ / गुट्ड॑
ꢔꢸꢞ꣄ꢞꢶ
गुड्डि
ꢂꢥ꣄ꢣꣁ
अन्दा॑
ꢮꢵꢪꢥꢦꢥ꣄ / ꢒꢸꢳ꣄ꢳꢦꢥ꣄
वामनपन / कुळ्ळपन
ꢒꢸꢳ꣄ꢳꣁ / ꢮꢵꢪꢥꣁ
कुळ्ळा॑ / वामना॑
ꢒꢸꢳ꣄ꢳꢶ
कुळ्ळि
ꢒꢹꢥ꣄
कून
ꢮꢔꢸꢠ꣄ꢜꣁꢣꣂꢠ꣄ / ꢮꣀꢠ꣄ꢜꢡꣂꢠ꣄
वगुण्टा॑तोण / वैण्टतोण
ꢌꢞꣁ
ए॑डा॑
ꢗꢾꢮ꣄ꢞꢶ
च॑व्डि
ꢗꢾꢮꢸꢜ꣄
च॑वुट
ꢡꢡ꣄ꢡꢸꢮꣁ
तुत्तुवा॑
ꢡꢡ꣄ꢡꢸꢮꢵꢥ꣄
तुत्तुवान
ꢪꣁꢠ꣄ꢞꢶ
मा॑ण्डि
ꢔꣁꢞ꣄ꢞꣁ
गा॑ड्डा॑
ꢔꣁꢞ꣄ꢞꢸ
गा॑ड्डु
ꢪꣁꢞꢪ꣄
मा॑डम
ꢪꣁꢠ꣄ꢞꢶ
मा॑ण्डि
ꢥꢵꢒ꣄ ꢒꢜꢫꢾꢱ꣄ꢡꢾꢥꣁ
नाक् कटय॑स्त॑ना॑
ꢪꣁꢞ꣄ꢞꢾ
मा॑ट्ट॑
ꢪꢸꢠ꣄ꢞꣁ / ꢨꣁꢞꢒ꣄
मुण्डा॑ / बा॑डक
ꢪꣁꢜ꣄ꢜꢾ
मा॑ट्ट॑
ꢡꢭꢹꢦꣁꢜ꣄ꢜꢭꢸꢮꢵꢥ꣄
तलूपोट्टलुवान


Script - Plants


ꢚꢵꢞ꣄ꢚꢜ꣄ꢒꢶꢥ꣄ ꢒꢶꢥꢸ ꢩꢵꢔꢸꢥ꣄
झाड्झट्किन किनु भागुन
ꢂꢞꢸꢪꢹꢳ꣄
अडुमूळ
ꢬꢿꢒ꣄ / ꢣꢳꣁ
रेक् / दळा॑
ꢦꢵꢥ꣄
पान
ꢦꢵꢥꢸꢥꢾꢬꢪ꣄
पानुनेरम्
ꢔꢾꢠꢸꢒ꣄
ग॑णुक
ꢮꢖ꣄ꢔꢶ
वङ्गि
ꢭꢫ꣄ꢞꣁ / ꢭꢔꢸꢞꣁ
लय्डा॑ / लगुडा॑
ꢥꢴꢥ꣄ ꢚꢜ꣄ꢒꢶ
न्हन झट्कि
ꢦꣁꢳ꣄ꢳꣁ / ꢦꢳ꣄ꢳꣁ
पा॑ळ्ळा॑ / पळ्ळा॑
ꢒꢵꢪ꣄ꢨꢸ / ꢡꢵꢠ꣄
काम्बु / ताण
ꢒꢫ꣄ꢭꣁ
कय्ला॑
ꢔꢾꢙ꣄ꢙꢥꢵ ꢚꢵꢜ꣄
ग॑ज्जनाझाट्
ꢯꢵꢔꣁ
शागा॑
ꢩꢙ꣄ꢙꢶ
भज्जि
ꢒꣁꢪ꣄ꢨꢸꢳꣁ ꢦꢵꢥ꣄
का॑म्बुळा॑पान्
ꢦꣁꢱ꣄ꢒꢾ / ꢔꢸꢳ꣄꣄ꢪꣁ
पा॑स्क॑ / गुळ्मा॑
ꢮꢶꢡ꣄ꢡꢸ / ꢨꢷꢒ꣄
वित्तु / बीक
ꢚꢳ꣄ꢳꣁ / ꢮꢿꢭ꣄ (ꢗꢸꢬ꣄ꢬꢶꢦꢜꢬ꣄)
झळ्ळा॑ / वेल् (चुऱ्ऱइपटर्)
ꢒꣁꢪ꣄ꢪꣁ
का॑म्मा॑
ꢱꢾꢒ꣄ꢒꢬ꣄ ꢒꢾꢳꢖ꣄ꢔꢸ
स॑क्कर क॑ळङ्गु
ꢔꣂꢠ꣄꣄ / ꢔꣂꢥ꣄
गोण / गोन
ꢡꢵꢡꢸꢪꢹꢳ꣄
तातुमूळ्
ꢗꢾꢡ꣄ꢡꣁ
च॑त्ता॑
ꢚꢜ꣄ꢒꢶ
झट्कि
ꢨꣁꢥ꣄ꢣꢿ
बा॑न्दे
ꢓꢜ꣄ꢜꢶ
खट्टि
ꢪꢸꢒꢸꢭꢸ ꢦꢵꢥ꣄ / ꢗꢶꢒꢸꢬ꣄ / ꢂꢖ꣄ꢒꢸꢬ꣄
मुकुलु पान / चिकुर / अङ्कुर
ꢢꣁꢳ꣄꣄ꢗꢶ
था॑ळ्चि
ꢗꢵꢫ꣄ꢦꢵꢥ꣄ / ꢜꢷ ꢦꢵꢥ꣄
चाय्पान / टी पान
ꢪꢫ꣄ / ꢪꢤꢸ / ꢡꢾꢥꢾ
मय / मधु / तेन॑
ꢣꢾꢙ꣄ꢙꢥꢵꢚꢵꢜ꣄ / ꢱꢡꢶꢙꢵꢞ꣄
ग॑ज्जना झाट / सतिजाड
ꢥꢵꢡ꣄ / ꢦꢷꢙꢵꢖ꣄ꢒꢸꢬ꣄
नात् / पीजाङ्कुर
ꢤꢹꢪ꣄ꢦꢵꢥ꣄
धूम्पान्
ꢱꢵꢳꢸ ꢦꢾꢫꢶꢬ꣄ / ꢱꢵꢳꢸ ꢆꢦꢙꢵꢮ꣄ / ꢦꢾꢫꢶꢬ꣄ ꢦꢠ꣄ꢜꣁ
साळु प॑यिर / साळु उपजाव / प॑यिर पण्टा॑
ꢆꢦꢙꢵꢮ꣄
उपजाव
ꢨꢵꢛ꣄ꢙꢶ
बाञ्जि
ꢦꢶꢥ꣄ꢣꣁ
पिन्दा॑
ꢨꢾꢡ꣄ꢡꢪ꣄ ꢮꢳ꣄ꢜꢶ
ब॑त्तम् / वळ्टि
ꢦꣁꢣꢬ꣄
पा॑दर्
ꢦꣁꢱ꣄ꢒꢾ
पा॑स्क॑
ꢲꢬꢳꢶ
हरळि
ꢧꢸꢭ꣄
फूल्
ꢧꢸꢭꢶ ꢚꢜ꣄ꢒꢶ
फूलु झट्कि
ꢃꢳ꣄ꢮꢥꢶ ꢒꢾꢳꢖ꣄ꢔꢸ
आळ्वळि क॑ळङ्गु
ꢓꢜꣁ
खटा॑
ꢪꣁꢭ꣄ꢒꣁ / ꢂꢖ꣄ꢒ꣄ꢬꣁ
मा॑ल्का॑ / अङ्क्रा॑
ꢨꣁꢖ꣄ꢔꢸ
बा॑ङगु
ꢪꢸꢔꢸꢭ꣄
मुकुल्
ꢪꢹꢳꢸꢒꢾꢳ꣄
मूळुकेळ्
ꢒꢿꢳꢸ ꢚꢵꢞ꣄
केळु झाड
ꢮꢶꢡ꣄ꢡꢸ
वित्तु
ꢨꢷꢒ꣄
बीक्
ꢪꢹꢭ꣄
मूल




Script - Politics


ꢬꢵꢙꢥꢷꢡꢶ / ꢬꢵꢙꢵꢖ꣄ꢔꢸ ꢒꢶꢥꢸ ꢥꢶꢬ꣄ꢮꢵꢔ꣄
राजनीति / राजाङ्गु किनु निर्वाग
ꢂꢖ꣄ꢔꢷꢒꢵꢬ꣄
अङ्गीकार्
ꢂꢗ꣄ꢗꢸ / ꢜꢖ꣄ꢒꢸ
अच्चु / टङ्कु
ꢦꢡ꣄ꢬꢮꢵꢲꢶꢥꢶ
पत्रवाहिनि
ꢦꢡ꣄ꢬꢮꢵꢲꢒꣁ / ꢦꢡ꣄ꢬꢮꢵꢲꣁ / ꢭꢿꢓꢸꢮꢵꢥ꣄
पत्रवाहका॑ / पत्रवाहा॑ / लेखुवान
ꢦꢡ꣄ꢬꢮꢵꢲ ꢒꢵꢬ꣄ꢫꢵꢭꢫꣁ
पत्रवाह कार्यालया॑
ꢒꣂꢰ꣄ꢜꢸ
कोष्टु
ꢆꢞ꣄ꢔꢞ꣄ꢠꢶ / ꢣꢪꢥꣁ
उड्गड्णि / दमना॑
ꢒꢸꢣꣁ
कुदा॑
ꢒꢸꢣꣁ
कुदा॑
ꢓꢵꢭ꣄ꢣꢳ꣄ ꢓꢵꢭ꣄ꢣꢾꢳꢪ꣄
खाल्दळ / खाद॑ळम्
ꢃꢤꢵꢬꢸ ꢨꢵꢡ꣄ꢫꢡꣁ
आधारु बाद्यता॑
ꢱ꣄ꢬꢿꢠꢶꢗꢵꢭ꣄
स्रेणिचाल
ꢂꢡ꣄ꢒꢫꢵꢬ꣄
अत्क्यार्
ꢂꢡ꣄ꢒ꣄ꢫꢵꢬꢶ
अत्क्यारि
ꢪꢥ꣄ꢡ꣄ꢬꢶ ꢒꢵꢬ꣄ꢫꢵꢭꢫꣁ
मन्त्रि कार्यालया॑
ꢪꢥ꣄ꢡ꣄ꢬꢶ / ꢂꢪꢵꢡ꣄ꢫꣁ
मन्त्रि / अमात्या॑
ꢪꢥ꣄ꢡ꣄ꢬꢶꢱꢨꣁ
मन्त्रिसबा॑
ꢯꢵꢥ꣄ꢡꢶ
शान्ति
ꢱꢖ꣄ꢕꢜꢶꢒꣁ / ꢱꢛ꣄ꢗꢭꢥꢒꢵꢬꣁ
सङ्घटिका॑ / सञ्चलनकारा॑
ꢮꢶꢣꢿꢱ꣄ / ꢩꢬꢳꢡꢿꢱ꣄
विदेस् / भरळदेस्
ꢬꢙꣁ / ꢬꢵꢜ꣄ / ꢩꢹꢦꣁ / ꢩꢹꢦꢡꢶ
रजा॑ / राट / भूपा॑ / भूपति
ꢬꢠꢶ / ꢬꢵꢜꢳꢶ
रणि / राटाळि
ꢬꢵꢙꢥꢷꢡꢶ
राजनीति
ꢱꢪ꣄ꢱ꣄ꢢꢵꢦꢥꣁ / ꢱꢪ꣄ꢮꢶꢤꢵ
सम्स्थापना॑ / सम्विधा
ꢬꢵꢙꢥꢷꢡꢶꢮꢵꢥ꣄
राजनीतिवान
ꢱꢬ꣄ꢒꢵꢬ꣄ / ꢬꢵꢙꢵꢖ꣄ꢔꢸ
सर्कार / राजाङ्गु
ꢬꢵꢙ꣄ꢩꢮꢥ꣄
राज्भवन
ꢬꢮꢸꢳ꣄ / ꢦ꣄ꢬꢵꢱꢵꢣꣁ
रवुळ् / प्रासादा॑
ꢍꢒꢒ꣄ / ꢄꢒꢵꢫ꣄
एकक् / इकाय
ꢭꢵꢜ꣄
लाट्
ꢒꢵꢬ꣄ꢫꢵꢭꢫꣁ
कार्यालया॑
ꢒꢵꢬ꣄ꢫꢵꢭꢫ ꢩꢰꣁ
कार्यालय भाषा॑
ꢂꢡ꣄ꢒꢵꢬꢶ
अत्कारि
ꢂꢮ꣄ꢱꢬꢸ ꢱꢵꢱꢥꣁ / ꢃꢦꢡ꣄ꢒꢵꢭꢸ ꢱꢵꢱꢥꣁ
अव्सरु सासना॑ / आपत्कालु सासना॑
ꢂꢮ꣄ꢱꢬ꣄ꢱ꣄ꢢꢶꢡꢶ
अव्सर्स्थिति
ꢨꣁꢮ꣄ꢥꢶꢕꢵꢜ꣄
बा॑व्निघाट्
ꢦꢬꢶꢪꢵꢠ꣄
परिमाण
ꢦ꣄ꢬꢒꢜꢥꣁ / ꢃꢮꢿꢣꢥꣁ / ꢮꢶꢰꢫꢒꢳꢞ꣄ꢠꢶ
प्रकटना॑ / आवेदना॑ / विषयकळट्णि
ꢦ꣄ꢬꢒꢞ꣄ꢠꢵꢬ꣄ / ꢦ꣄ꢬꢒꢞꢠꣁꢒꢾꢬ꣄ꢥꢵꢬ꣄ / ꢮꢶꢰꢫꢸ ꢒꢳꢞ꣄ꢥꢵꢬ꣄
प्रकड्णार / प्रकडणा॑ क॑र्नार / विषयु कळड्नार
ꢱꢹꢗꢥꣁ
सूचना॑
ꢱꢹꢗꢥꢵ ꢦꣁꢭ꣄ꢒꣁ
सूचना पा॑ल्का॑
ꢂꢥꢸꢪꢡ꣄
अनुमत्
ꢂꢥꢸꢪꢡ꣄ ꢱꢹꢗꢶ
अनुमत्सूचि
ꢂꢥꢸꢩꢮ꣄
अनुभव
ꢒꢨ꣄ꢙꣁ / ꢃꢒ꣄ꢬꢪꢠꣁ
कब्जा॑ / आक्रमणा॑
ꢱꢵꢱꢥꣁ / ꢱꣃꢱꢱ꣄ꢡꢾ / ꢱꣃꢱꢶꢥꢶ
सासना॑ / सौसस्ते / सौसिनि
ꢬꢵꢙ꣄ꢫ ꢩꢰꣁ
राज्य भाषा॑
ꢃꢙ꣄ꢛꢾ
आजञो
ꢥꢶꢫꣂꢔꣁ / ꢃꢫꣂꢔ꣄
नियोगा॑ / आयोग
ꢥꢶꢫꣂꢔꢶ / ꢃꢫꣂꢒꢶ
नियोगि / आयोगि
ꢂꢣ꣄ꢭꢥ꣄ / ꢂꢣ꣄ꢥꢶ
अद्लन / अद्नि
ꢭꢵꢨ꣄ / ꢂꢣꢵꢮ꣄
लाब् / अदाव
ꢦ꣄ꢬꢩꢸꢡ꣄ꢮꣁ / ꢂꢬ꣄ꢒ꣄ꢫꢵꢬ꣄ / ꢃꢤꢶꢦꢡ꣄ꢫꣁ
प्रभुत्वा॑ / अर्क्यार / आधिपत्या॑
ꢆꢡ꣄ꢦꢵꢣꢥꢱꢸꢭ꣄ꢒꣁ
उत्पादनसुल्को
ꢱꢸꢭ꣄ꢒꣁ / ꢒꢬꣁ
सुल्का॑ / करा॑
ꢃꢫꢸꢱ꣄ꢣꢠ꣄ꢞꢥꣁ
आयुस्दण्डना॑
ꢆꢡ꣄ꢱꢵꢲ꣄ / ꢒꢮ꣄ꢡꢸꢒꣁ
उत्साह / कव्तुका॑
ꢃꢭꣂꢱꢥꣁ / ꢂꢩꢶꢦ꣄ꢬꢵꢫꢸ
आलोसना॑ / अभिप्रायु
ꢭꢶꢓꢾꢦꢡ꣄ꢡꢬ꣄ / ꢭꢿꢓ ꢦ꣄ꢬꢪꢵꢠꣁ
लिख॑पत्तर / लेख प्रमाणा॑
ꢱꢵꢱꢥꢦꢒ꣄ꢰꣁ
सासन पक्षो
ꢬꢵꢙ꣄ꢦꢵꢭ꣄
राज्पाल्
ꢬꢵꢙ꣄ꢦꢵꢭꢥꣁ
राज्पालना॑
ꢏꢦ꣄ꢦꢶꢭꢶꢥꢶ / ꢱꢪ꣄ꢪꢡ꣄
आ॑प्पिलिनि / सम्मत
ꢒꢨꢥ꣄ꢣꢸꢱꢬ꣄ꢒꢵꢬ꣄
कबन्दु सर्कार्
ꢂꢥ꣄ꢡꢬ꣄ꢥꢶꢰꢾꢤ꣄ / ꢪꢴꢣ꣄ꢣꢶꢪꢸ ꢲꢶꢨ꣄ꢨꢞ꣄ꢠꢶ
अन्तर्निषेध / म्हद् मद्दिमु हिब्बड्णि
ꢣꢾꢬ꣄ꢒꢭꢶ / ꢪꢴꢣ꣄ꢫꢮꢬ꣄ꢡꢶ
तेर्कलि / म्हद्यवर्ति
ꢂꢮ꣄ꢞꢒꢵꢭꢸ ꢗꢸꢥꢵꢮ꣄
अव्डकालु चुनाव
ꢪꢴꢣ꣄ꢣꢶꢪ꣄ ꢲꢶꢨ꣄ꢨꢞ꣄ꢠꢶ / ꢂꢮꢭꢪ꣄ꢨ꣄ꢥꣁ / ꢡꢡ꣄ꢒꢵꢭꢸ ꢲꢶꢨ꣄ꢨꢞ꣄ꢠꢶ
म्हद्दिमहिब्बड्णि अवलम्बना॑ / तत्कालु हिब्बड्णि
ꢌꢠ꣄ꢔꢶꢥꢶ / ꢂꢥꢸꢬꢹꢦꢡꣁ
ए॑ण्गिनि / अनुरूपता॑
ꢱꢲ ꢪꢥ꣄ꢡꢶꢬꢶ
सह मन्तिरि
ꢱꢾꢬ꣄ꢗꢥ꣄ꢩꢵꢰꣁ / ꢱꢥ꣄ꢣꢶ ꢩꢵꢰꣁ
च॑र्चन्भाषा॑ / सन्दि भाषा॑
ꢱꢪ꣄ꢫꢸꢒ꣄ꢡ ꢱꢖ꣄ꢕꣁ
सम्युक्त सङ्घा॑
ꢱꢛ꣄ꢙꢶꢒꢾ
सञ्जिका॑
ꢩꢵꢬꢡꢥꢶꢬ꣄ꢮꢵꢲꢸꢱꢿꢮꣁ
भारत निर्वाहु सेवा॑
ꢩꢵꢬꢡ ꢂꢦꢬꢵꢤꢸ ꢱꢵꢱꢥꣁ
भारत अपराधु सासना॑
ꢃꢥ꣄ꢣꣂꢭ꣄
आन्दोल
ꢒꢵꢬ꣄ꢫꢵꢭꢫ ꢱꢖ꣄ꢔꢪꣁ
कार्यालय सङ्गमा॑
ꢥꢶꢬ꣄ꢮꢵꢲꢶ / ꢥꢶꢬ꣄ꢣꢿꢱꢒ꣄ / ꢂꢤ꣄ꢫꢒ꣄ꢰꣁ
निर्वाहि / निर्देसक / अध्यक्षो
ꢂꢣ꣄ꢫꢵꢫ꣄
अद्याय
ꢗꢬ꣄ꢒꢵ
चर्का
ꢆꢬꢵꢮ꣄ꢱꣁꢬꢵꢮ꣄
उराव्सा॑राव
ꢭꢒ꣄ꢰꢫꣁ
लक्ष्या॑
ꢪꢸꢣ꣄ꢬꣁ
मुद्रा॑
ꢮꢶꢩꢵꢒ
विभाक
ꢫꢸꢮꢬꢵꢜ꣄
युवराट्
ꢫꢸꢮꢬꢵꢠꢶ / ꢫꢸꢮꢬꢵꢙ꣄ꢛꢶ
युवराणि / युवराजञि
ꢲꢸꢡ꣄ꢡꢸꢬꢵꢮ꣄ / ꢲꢸꢡ꣄ꢡꢸꢬꢵꢜ꣄
हुत्तुराव / हुत्तुराट
ꢦ꣄ꢬꢡꢶ ꢧꣁꢳ꣄꣄
प्रतिफोळ
ꢆꢖ꣄ꢙꢪꢶꢡꢶ
उञचमिति
ꢆꢳ꣄ꢳꢸ
उळ्ळु
ꢱꢲꢗꢵꢬ꣄ / ꢱꢥ꣄ꢤꢶ
सहचार् / सन्धि
ꢦꢬꢱ꣄ꢦꢬ ꢱꢪ꣄ꢪꢥ꣄ꢣꣁ / ꢦꢬꢱ꣄ꢦꢬ ꢏꢱ꣄ꢡꢦꢥ꣄
परस्पर सम्मन्दा॑ / परस्पर आ॑स्तपन
ꢃꢲꢵꢬꢸ ꢮꢶꢩꢵꢔ꣄ / ꢓꢥꢶ ꢮꢶꢩꢵꢔ꣄
आहारु विभाग / खनिविभाग
ꢆꢡ꣄ꢡꢬꢮꢵꢣ꣄
उत्तरवाद
ꢃꢒ꣄ꢒꢸꢣꣁ
आक्कुtaaq
ꢱꢲꢒꢵꢬ꣄ / ꢱꢲꢵꢮ꣄
सहकार / सहाव
ꢆꢦ ꢪꢥ꣄ꢡꢶꢬꢶ
उप मन्तिरि
ꢆꢦ ꢣꢹꢡ ꢥꢶꢮꢵꢱ꣄
उप दूत निवास्
ꢮꢿꢡꢥꣁ
वेतना॑
ꢆꢦꢶꢬ꣄ / ꢮꢿꢥ꣄ / ꢂꢣ꣄ꢣꢶ / ꢂꢡꢶꢬꢶꢒ꣄ꢡ
उपिर / वेन / अद्दि / अतिरिक्त
ꢄꢗ꣄ꢗꢵ ꢦꢡ꣄ꢡꢬ꣄
इच्चा पत्तर
ꢂꢥꢸꢒ꣄ꢛꢵ ꢦꢸꢡ꣄ꢬꣁ
अनुकञा पत्रा॑
ꢨꢵꢣ꣄ꢫꣁ
बाद्या॑
ꢨꢞ꣄ꢫꢮꢵꢥ꣄
बाद्यवान्
ꢙꢸꢥꢡ꣄ꢮꢵꢥ꣄ / ꢓꢿꢡꢶ
जुनत्वान / खेति
ꢔ꣄ꢬꢲ ꢮꢶꢩꢵꢔ꣄
ग्रह विभाग
ꢮꢶꢰꢫ ꢱꢸꢗꢶꢒꣁ
विषयसूचिका॑
ꢂꢥ꣄ꢡꢬ꣄ ꢬꢵꢙ꣄ꢙꢶ
अन्तर्राज्जि
ꢥꢶꢮꢿꢰ꣄ꢫꣁ
निवेष्या॑
ꢆꢡ꣄ꢦꢣ꣄ / ꢆꢡ꣄ꢦꢵꢣꢥꣁ
उत्पद / उत्पादना॑
ꢤꢶꢞꢮꢵꢒ꣄
धिडवाक
ꢂꢖ꣄ꢔꢱ꣄ꢢꢸ
अङ्गस्थु
ꢱꣁꢪ꣄ꢨꢸꢳꣁ / ꢮꢾꢡꢥꣁ
सोम्बुळा॑ / वेतना॑
ꢮꢵꢲꢥꣁ
वाहना॑
ꢙꢵꢥ꣄ꢮꢵꢱ꣄ / ꢱꣂꢩꢵꢫꢵꢡ꣄ꢬꣁ / ꢏꢬꢵꢡ꣄ / ꢗꢸꢜ꣄ꢜꢸ
जान्वास / सोभा यात्रा॑ / ओरात / चुट्टु
ꢔꢶꢬꢵꢪ꣄ꢫꣁ
गिराम्या॑
ꢔꢵꢪꢠ꣄ꢗꢥ꣄ / ꢱꢛ꣄ꢗꢵꢬꢸ ꢥꢰꢿꢤꢥꣁ
गामण्चन् / सञचारु निषेधना॑
ꢦꢠꢖ꣄ꢗꢵꢫꢡ꣄ ꢬꢵꢙ꣄ꢙꢶ
पञ्चायत्राज्जि
ꢦꢖ꣄ꢗꢵꢫꢡꢕꢿꢬ꣄
पञ्चायघेर्
ꢨ꣄ꢬꢰ꣄ꢜꢵꢗꢵꢬ꣄ / ꢪꢭꢶꢥꢵꢗꢵꢬ꣄
ब्रष्टाचार / मलिनाचार
ꢱꢿꢮꣁ
सेवा॑
ꢱꢿꢮꢒꣁ / ꢱꢿꢮꣁ ꢒꢾꢬ꣄ꢥꢵꢬ꣄
सेवका॑ / सेवा॑ केर्नार
ꢱꢖ꣄ꢓ꣄ꢫꢵꢦꣁꢭ꣄ꢒꣁ
सङ्खयापा॑ल्का॑
ꢮꢶꢩꢒ꣄ꢰꢸ
विभक्षउ
ꢡꣂꢒ꣄ꢱꢥꢶ / ꢦ꣄ꢬꢡꢷꢒ꣄ꢰꣁ
दोक्सनि / प्रतीक्षो
ꢦ꣄ꢬꢡꢶꢤ꣄ꢮꢥꢶ
प्रति ध्वनि
ꢦ꣄ꢬꢡꢶꢗꢵꢫꢵ / ꢦ꣄ꢬꢡꢶ ꢨꢶꢪ꣄ꢨꢸ
प्रतिचाया / प्रति बिम्बु
ꢍꢒꢵꢤꢶꢦꢡꢶ / ꢱ꣄ꢮꢿꢗ꣄ꢗꢵꢗꢵꢬꢶ
एकाधिपति / स्वेच्चाचारि
ꢌꢭ꣄ꢔꢾ / ꢂꢣ꣄ꢣꢸ / ꢱꢷꢪꣁ
एल्ग॑ / अद्दु / सीमा॑
ꢱꢷꢪꢵ ꢡꢾꢔꢸꢬꢵꢭ꣄ / ꢂꢣ꣄ꢣꢸ ꢡꢾꢔꢸꢬꢵꢭ꣄
सीमा त॑गुराल / अद्दु त॑गउराल
ꢭꢶꢦꢶꢒꣁ / ꢔꢸꢪꢱ꣄ꢡꣁ
लिपिका॑ / गुमस्ता॑
ꢗꢾꢣꢸꢮꢸ ꢛꢵꢥ꣄
च॑दुवु ञान
ꢭꢿꢓꢥꢱꢵꢪꢔ꣄ꢬꢶ / ꢭꢿꢓꢮꢱ꣄ꢡꢸ
लेखन सामग्रि / लेखवस्तु
ꢌꢙꢪꢵꢥ꣄ / ꢪꣁꢣ꣄ꢬꢳꢶ
एजमान / मा॑द्रळि
ꢱ꣄ꢮꢿꢗ꣄ꢗꢵꢗꢵꢬ꣄
स्वेच्चाचार
ꢍꢒꢵꢤꢶꢦꢡꢶ / ꢱꢬ꣄ꢮꢵꢡꢶꢒꢵꢬꢶ
एकाधिपति / सर्वातिकारि
ꢂꢥꢸꢒ꣄ꢬꢪꣁ
अनुक्रमा॑
ꢱ꣄ꢮꢷꢒꢵꢬ꣄ / ꢂꢖ꣄ꢔꢷꢒꢵꢬ꣄ / ꢏꢦ꣄ꢦꢶꢭ꣄ꢥꢶ
स्वीकार / अङ्गीकार / आ॑प्पिल्नि
ꢆꢖ꣄ꢗ ꢓꢵꢭ꣄
उञ्च खाल्
ꢲꢶꢖ꣄ꢔꢵꢮ꣄ / ꢥꢶꢬ꣄ꢫꢵꢡ꣄ / ꢲꢶꢖ꣄ꢔꢵꢜ꣄
हिङ्गाव् / निर्यात / हिङ्गाट
ꢎꢒ꣄ꢫ ꢬꢵꢰ꣄ꢜ꣄ꢬ ꢱꢪ꣄ꢱ꣄ꢡꢵꢥ꣄
ऐक्य राष्ट्र सम्स्तान
ꢎꢒ꣄ꢫ ꢂꢔ꣄ꢬꢠꢶ
ईक्य अग्रणि
ꢣꣁꢦ꣄ꢦꢵ ꢢꣁꢮ꣄ꢥꢶ
दा॑ब्बि थोव्नि /
ꢱꢲꢒꢵꢬ꣄ / ꢱꢲꢫꣂꢔ꣄
सहकार् / सहयोग
ꢮꢶꢩꢵꢙꢥꣁ
विभाजना॑
ꢦꢬꢮꢱꣁ ꢒꢾꢬ꣄ꢥꢶ
परवसा॑ क॑र्नि
ꢏꢦ꣄ꢦꢥ꣄ꢣ ꢱꢹꢗꢥꣁ
आ॑प्पन्द सूचना॑
ꢏꢦ꣄ꢦꢥ꣄ꢣꢪ꣄
आ॑प्पन्दम
ꢲꢵꢡꢸ ꢂꢒ꣄ꢰꢬ꣄
हातु अक्षर
ꢱ꣄ꢮꢷꢒꢬ꣄ꢥꢶ / ꢦ꣄ꢬꢵꢦ꣄ꢡꢶ ꢱꢖ꣄ꢔꢶꢥꢶ
स्वीकर्नि / प्राप्ति सङ्गिनि
ꢏꢦ꣄ꢦꢶꢭ꣄ꢥꢶ
आ॑प्पिल्नि
ꢭꢿꢡꢥꢶ
लेतनि
ꢎꢒ꣄ꢫ ꢩꢵꢮꢥꣁ
ऐक्यभावना॑
ꢥꢶꢫꢪꣁ
नियमा॑
ꢤꣁꢥꢶꢥꢾꢬ꣄ꢦꢶꢥꢶ / ꢤꣁꢥꢶ ꢦ꣄ꢬꢱꢵꢬ꣄
धा॑नि न॑र्पिनि / धा॑नि प्रसार
ꢬꢹꢦꢸ ꢥꢾꢬ꣄ꢦꢶꢥꢶ / ꢬꢹꢦꢸ ꢦ꣄ꢬꢱꢵꢬ꣄
रूपु न॑र्पिनि / रूपु प्रसार
ꢭꢸꢔ꣄ꢙꢵꢥꢶ / ꢔꢸꢦ꣄ꢡꢗꢵꢬꢶ / ꢔꢸꢦ꣄ꢡꣁ / ꢔꢸꢞꢵꢗꢵꢬꢶ
लुगञानि / गुप्तचारि / गुप्ता॑ / गुडाचारि
ꢒꢸꢣ꣄ꢮꣁ
कुट्रा॑
ꢗꢖ꣄ꢔꢪ꣄
चङ्गम्
ꢮꢵꢒ꣄ / ꢪꢡꢣꢵꢥ꣄ / ꢮꢵꢔ꣄ꢣꢵꢥ꣄
वाक् / मतदान / वाग्दान
ꢮꢵꢒ꣄ ꢨꢵꢡ꣄ꢫꣁ
वाक्बात्या॑
ꢮꢶꢱ꣄ꢬꢵꢥ꣄ꢡꢶ / ꢮꢶꢬꢡꢶ
विस्रान्ति / विरति
ꢒꢒ꣄ꢰꢶ
कक्षि
ꢱꢸꢭ꣄ꢒꢪ꣄ / ꢣꢬꣁ / ꢪꣂꢭ꣄
सूल्कम् / दरा॑ / मोल्
ꢒꢾꢜ꣄ꢜꣁ
केट्टा॑
ꢥꢶꢫꢪꣁ
नियमा॑
ꢙꢭ ꢱꢿꢥꣁ
जल सेना॑
ꢬꢷꢠ꣄
रीण
ꢬꢷꢠꢸꢩꢵꢬ꣄
रीणुभार
ꢱꢾꢮ꣄ꢒꢥ꣄
स॑व्कन्
ꢔꢮꢸꢛ꣄ꢙꢶ ꢔꢮꢸꢛ꣄ꢙꢸꢥꢵꢬ꣄ / ꢥꢶꢬꢷꢰꢠꣁ
गवुञ्जि / गवुन्जुनार् / निरीकक्षणा॑
ꢭꢴꢾꢒꢒꣀꢡ꣄
ल्हेककैत
ꢭꢴꢾꢒ꣄ꢒꣁ ꢲꢾꢞ꣄ꢠꢶ / ꢔꢠꢥꣁ
ल्ह॑क्का॑ हेड्णि / गणना॑
ꢔꢠꢶꢠꢶ / ꢲꢷꢱꢸꢥꢿꢭ꣄ / ꢭꢴꢾꢒ꣄ꢒꢥꢶ
गणिणि / हीसुनेल / ल्ह॑क्कनि
ꢨꢥ꣄ꢤꢸ
बन्धु
ꢂꢩꢶꢦ꣄ꢬꢵꢫ
अभिप्राय
ꢇꢲꣁ / ꢇꢲꢥꣁ
ऊहा॑ / ऊहना॑
ꢭꢴꢾꢒ꣄ꢒꢵꢮ꣄
ल्ह॑क्काव
ꢦꣁꢒ꣄ꢒꢶꢰꢪ꣄ / ꢮꢶꢡ꣄ꢡꢒꣂꢰ꣄
पा॑क्किषम् / वित्तकोष
ꢮꢶꢣ꣄ꢫꢵ ꢪꢥ꣄ꢡ꣄ꢬꢶ
विद्या मन्त्रि
ꢮꢶꢣ꣄ꢫꢵ ꢮꢶꢩꢵꢔ꣄
विद्याविभाग्
ꢪꢶꢱ꣄ꢬꢠꣁ
मिस्रणा॑
ꢪꢶꢱ꣄ꢡ ꢙꢵꢡ꣄
मिस्तजात्
ꢆꢣꢵꢱꢷꢥ꣄ / ꢆꢦꢾꢒ꣄ꢰꣁ
उदासीन / उपेक्षो
ꢱꢩꣁ / ꢱꢪ꣄ꢱ꣄ꢢꢵꢥ꣄
सभा॑ / सम्स्थान
ꢩꢶꢞ꣄ꢠꢶ
भिड्णि
ꢤꢵꢡꢸ
धातु
ꢓꢙꢵꢥꣁ
खजाना॑
ꢲꢥ꣄ꢥꢮꢸ ꢦꢡꢡ꣄ꢬ꣄
हन्नवुपत्रर
ꢬꢰꢠꢒꢬ꣄ꢥꢶ
रक्षणकर्नि
ꢬꢰꢠ ꢩꢬ꣄ꢡꢶ
रक्षणभर्ति
ꢪꢸꢱꢶꢥꢶ
मुसिनि
ꢦꣁꢭꢶꢱ꣄ꢥꢶꢬꢷꢒ꣄ꢱꢒꣁ / ꢢꢵꢠꢵ ꢥꢶꢬꢶꢒ꣄ꢰꢒꣁ
पोलिस्निरीक्षका॑ / थाणा निरिक्षका॑
ꢬꢴꢒ꣄ꢒꣀꢡ꣄ / ꢬꢴꢒ꣄ꢒꢸꢮꢵꢥ꣄
र्हक्कैत / र्हक्कुवान
ꢢꢵꢠꢵꢮꢶꢩꢵꢒ꣄
थाणाविभाक
ꢢꢠꢫ꣄ꢡꢸ
थाणय्तु
ꢒꢶꢞ꣄ꢞꢖ꣄ꢒꢶ
किड्डङ्कि
ꢥꢴꢥꢦꣁꢬ꣄ꢱꢾ / ꢥꢴꢥ꣄ꢔꢵꢪ꣄ / ꢥꢴꢥ꣄ ꢦꣁꢜ꣄ꢒ꣄ꢫꢵꢜ꣄
न्हन्पा॑र्स॑ / न्हन्गाम / न्हन पा॑ट्क्याट
ꢔꢠ ꢡꢥ꣄ꢡ꣄ꢬꢸ / ꢔꢠ ꢬꢵꢙ꣄ꢫꢸ / ꢦ꣄ꢬꢙꢵ ꢦ꣄ꢬꢩꢸꢡ꣄ꢮꣁ
गण तन्त्रु / गण राज्यु / प्रजा प्रभुत्वा॑
ꢙꢥꢵꢡꢶꢦꢡꢶ
जनातिपति
ꢦ꣄ꢬꢙꢵ ꢨꢵꢡ꣄ꢫꢸ / ꢥꢵꢔꢬꢶꢒꢡꣁ
प्रजाबात्यु / नागरिकता॑
ꢒꢸꢜꢸꢪ꣄ꢨ ꢥꢶꢬꣂꢡ꣄
कुटुम्बनिरोत्
ꢒꢸꢜꢸꢪ꣄ꢨ ꢒ꣄ꢰꢿꢪ ꢮꢶꢩꢵꢔ꣄
कुटुम्प क्षेम विभाग
ꢏꢡ꣄ꢡꢶ
आ॑त्ति
ꢔꢸꢪ꣄ꢱ꣄ꢡꣁ
गुमस्ता॑
ꢔꢸꢪ꣄ꢦꢸ
गुम्पु
ꢂꢦꢬꢵꢤ꣄ / ꢘꢸꢒ꣄ꢕꢭ꣄ꢥꢶ
अपराध / चूक्घल्नि
ꢂꢦꢬꢵꢤ꣄
अपराध
ꢗꢶꢥ꣄ꢲꢸꢥ꣄ / ꢔꢸꢬ꣄ꢡꢸꢥ꣄
चिनहुन / गुर्तुन
ꢱꢶꢥ꣄ꢡꢸꢱꢖ꣄ꢓ꣄ꢫꣁ
सिन्तु सङ्ख्या॑
ꢱꢶꢥ꣄ꢲꢸ / ꢔꢸꢬ꣄ꢡꢸ
सिन्हु / गुर्तु
ꢆꢥ꣄ꢥ ꢦꣁꢞꢾꢫꣁ / ꢆꢥ꣄ꢥ ꢦꢒ꣄ꢯꢸ
उन्न पा॑ड॑या॑ / उन्न पक्षु
ꢦꢒ꣄ꢯ ꢎꢒ꣄ꢫꢡꣁ
पक्ष ऐक्यता॑
ꢪꢹꢔꣁ / ꢔꢸꢪ꣄ꢦꢸꢪꢶꢳ꣄ꢥꢶ / ꢪꢶꢳ꣄꣄ꢠꢶ
मूगा॑ / गुम्पु / मिळ्नि / मिळ्णि
ꢪꢔꢶꢥꢶ
मगिनि
ꢓꢿꢭꢸ ꢒ꣄ꢬꢶꢫꣁ / ꢪꢥꣂꢬꢛ꣄ꢙꢥ꣄
खेलु क्रिया॑ / मनोरञ꣄जन
ꢲꢵꢡꢸ ꣄ꢪꢔꣁ
हातु मगा॑
ꢩꢥ꣄ꢣꢶ
भन्दि
ꢡꢸꢰ꣄ ꢦ꣄ꢬꢫꣂꢔ꣄
तुष्प्रयोग
ꢭꢾꢛ꣄ꢙꢪ꣄ ꢨꢶꢮ꣄ꢙꢞ꣄
ल॑ञ्जम् / बिव्जड्
ꢲꢵꢡꢸꢦꣁꢡꢶ
हातुपा॑ति
ꢬꢷꢠꢸꢨꢥ꣄ꢣꢶ
रीणुबन्दि
ꢤꣁꢙ꣄
धा॑ज
ꢤꣁꢙ ꢱ꣄ꢢꢪ꣄ꢨꢸ
धा॑ज स्थम्बु
ꢭꢒ꣄ꢰ꣄ꢫꢸ / ꢤ꣄ꢫꢿꢫꢸ
लक्ष्यु / ध्येयु
ꢮꢶꢩꢵꢔ꣄
विभाग
ꢣꢸꢬꢸꢔ꣄
दुरुग्
ꢥꢶꢫꢪꣁ / ꢱꢶꢣ꣄ꢣꢵꢥ꣄ꢡꢸ
नियमा॑ / सिद्दान्तु
ꢒꣂꢠ꣄ / ꢒꣁꢥꣁ / ꢣ꣄ꢬꢸꢰ꣄ꢜꢶꢒꣂꢠ꣄
कोण / का॑ना॑ / द्रुष्टिकोण
ꢦꣁꢪꢜ꣄
पा॑मट
ꢪꢒꢶꢥꢶ / ꢒꣁꢬꢶ
मगिनि / का॑रि
ꢮꢬ꣄ꢔꢸ / ꢔꣂꢰ꣄ꢜꢶ
वर्गु / गोष्टि
ꢗꢒ꣄ꢬꢮꢬ꣄ꢡ꣄ꢡꢶ
चक्रवर्त्ति
ꢩꣀ-ꢩꢾꢫ꣄ꢥꢥꢸꢦꢥ꣄
भै-भेय्ननुपन
ꢱꢖ꣄ꢔꢪ꣄ / ꢱꢖ꣄ꢕꣁ / ꢱꢩꣁ
सङ्गम् / सङ्घा॑ / सभा॑
ꢱꢜ꣄ꢜꢱꢩꣁ / ꢮꢶꢤꢵꢥ꣄ ꢱꣃꢤꣁ / ꢮꢶꢤꢵꢥꢸ ꢱꣃꢤꣁ / ꢮꢶꢤꢵꢥ꣄ ꢱꢩꣁ
सट्टसभा॑ / विधान सैधा॑ / विधानु सौधा॑ / विधान सभा॑
ꢱꢵꢱꢥꢪꢬ꣄ꢗꢶꢥꢶ / ꢱꢵꢱꢥ ꢡꢶꢣ꣄ꢡꢸꢮꢳꢶꢶ / ꢱꢵꢱꢥ ꢱꢹꢤꢵꢬ꣄
सासनमर्चिनि / सासन तिद्तुवळि / सासन सुधार
ꢱꢵꢱꢥꣁ / ꢮꢶꢤꢵꢥ꣄
सासना॑ / विधान
ꢱꢜ꣄ꢜꢱ꣄ꢩꣁ
सट्टसभा॑
ꢱꢡ꣄ꢫꢵꢔ꣄ꢬꢲꣁ
सत्याग्रहा॑
ꢱꢾꢡ꣄ꢡꢬ꣄
स॑त्तर्
ꢱꢡꢶ
सति
ꢱꢩꢵꢥꢵꢫꢒꣁ
सभानायका॑
ꢱꣁꢪ꣄ꢦꢸꢳꢵ ꢗꢾꢜ꣄ꢥꢶ
सा॑म्पुळाच॑ट्नि
ꢱꣁꢪ꣄ꢨꢸꢳꣁ / ꢦꢔꢵꢬ꣄
सा॑म्बुळा॑ / पगार
ꢱꢪꢵꢥꢸꢦꢥ꣄
समानुपन
ꢱꢵꢪꢵꢣꢵꢥ꣄
समादान्
ꢱꢪꢸꢣꢵꢫ꣄ / ꢱꢪꢹꢲꢸ
समुदाय / समूहु
ꢱꢬ꣄ꢮꢵꢤꢶꢒꢵꢬ꣄
सर्वाधिकार्
ꢱꢬ꣄ꢮꢵꢤꢶꢒꢵꢬꢶ
सर्वाधिकारि
ꢬꢪꢵꢬꢪꢶ
रमारमि
ꢱꢾꢭ꣄ꢒꢾ / ꢱꢲꢵꢮꢸ
स॑ल्क॑ / सहावु
ꢱꢵꢤꢥꣁ / ꢆꢦꢭꢨ꣄ꢤꢶ / ꢭꢨꢶꢛ꣄ꢗꢶꢥꢶ
साधना॑ / उपलब्धि / लबिञ्चिनि
ꢱꢪ꣄ꢱ꣄ꢫꣁ / ꢦ꣄ꢬꢱ꣄ꢥꣁ
समस्या॑ / प्रस्ना॑
ꢆꢥ꣄ꢥꢮꢿꢱ꣄ / ꢱꣁꢜ꣄ꢜꢸ
उन्नवेस् / सा॑ट्टु
ꢮꢶꢒꢵꢬ꣄ / ꢥꢱꢶꢥꢪ꣄ / ꢱꢶꢡꢶꢭ꣄
विकार / नसिनम / सितिल
ꢱꢸꢨꢬ꣄ꢗꢶ
सुबर्चि
ꢱꢶꢪ꣄ꢲꢵꢱꢥꣁ / ꢱꢶꢪ꣄ꢲꢹ ꢃꢱꢥꣁ
सिम्हासना॑ / सिम्हु आसना॑
ꢂꢭ꣄ꢦ ꢱꢖ꣄ꢓꢫꣁ
अल्प सङ्खया॑
ꢥꢴꢥ꣄ꢥ ꢣꢵꢮꣁ
न्हन्न दावा॑
ꢒꢵꢬꢵꢔ꣄ꢬꢆ / ꢙꢾꢫꢶꢭ꣄
काराग्रहु / ज॑यिल
ꢪꢸꢣ꣄ꢬꣁ / ꢗꢶꢥ꣄ꢲꢸ
मुद्रा॑ / चिन्हु
ꢮꢵꢒ꣄ꢒꢸꢗꢷꢜ꣄
वाक्कुचीट
ꢱꢸꢒꢬ꣄ꢠꢶ / ꢱꢸꢤꢵꢬ꣄
सूकर्णि / सुधार
ꢱꢪꢬꢹꢦ ꢮꢱ꣄ꢡꢬ꣄
समरूप वस्तर
ꢱꢸꢭ꣄ꢒꢪ꣄ / ꢱꢸꢭ꣄ꢒꣁ
सुल्कम् / सुल्का॑
ꢱꢸꢡꢥ꣄ꢣꢬꢸ
सुतन्द्रु
ꢣꢸꢰ꣄ꢦ꣄ꢬꢫꣁꢒ꣄
दुष्प्रयोक
ꢱꢖ꣄ꢒ꣄ꢯꢾꢦꢸ
सङ्क्क्षेपु
ꢩꢷꢡꢸꢬ꣄ ꢣꢾꢮ꣄ꢱꢶꢥꢶ
भीतुर् द॑व्सिनि
ꢗꢸꢜ꣄ꢜꢸꢬ꣄ ꢒꢳꢞ꣄ꢠꢶ / ꢦꢬꢶꢦꢡ꣄ꢡꢬ꣄
चुट्टुर् कळड्णि / परिपत्तर
ꢪꢬꢵꢪꢡ꣄ꢡꢸ / ꢱꢸꢤꢬꢠꣁ / ꢗꢪ꣄ꢱ꣄ꢒꢬꢠꣁ
मरमत्तु / सुधरणा॑ / चम्स्करणा॑
ꢱꢹꢗꢥ ꢮꢶꢩꢵꢔ꣄ / ꢱꢪꢵꢗ꣄ꢗꢵꢬꢸ ꢮꢶꢩꢵꢔ꣄
सूचन विभाग / समाच्चारु विभाग
ꢱꢗꢶꢮꢵꢭꢫꣁ
सचिवालया॑
ꢒꢵꢬ꣄ꢫꢣꢬ꣄ꢱꢶ
कार्यदर्सि
ꢨ꣄ꢬꢩꢵꢮ꣄
प्रभाव्
ꢮꢿꢱꢸꢥ꣄
वेसुन्
ꢮꢿꢱ
वेस
ꢣꢾꢜ꣄ꢜꢸ
देट्टु
ꢒ꣄ꢯꢡꢶ
क्षति
ꢱꢿꢡꢵꢬꢪ꣄
सेतारम्
ꢆꢬꢵꢮ
उराव
ꢱꢿꢥꢵꢤꢶꢦꢡꢶ
सेनाधिपति
ꢱꢫ꣄ꢒꢥꣁ / ꢱꢪꢶꢙ꣄ꢛꢸ
सय्कना॑ / समिज्ना॑
ꢱꣁꢡ꣄ꢡꢸ
सा॑त्तु
ꢮꢶꢮꢵꢡ꣄ / ꢡꢾꢔꢸꢬꢵꢭ꣄
विवात / त॑गुराल
ꢫꣂꢔ꣄ꢫꢡꣁ / ꢭꢵꢔꢶꢡꣁ
योग्यता॑ / लागिता॑
ꢜꢖ꣄ꢒꢠꢒꢬ꣄ꢡꣁ
टङकणकर्ता॑
ꢪꢵꢬ꣄ꢔꢸ
मार्गु
ꢃꢞ꣄ꢞꢪꢸꢥ꣄ / ꢂꢞ꣄ꢞꢶꢥ꣄ / ꢨꢵꢤꢵꢥ꣄
अड्डामुन / अड्डिन / बाधान
ꢣꢠ꣄ꢞꢠꣁ
दण्डणा॑
ꢣꢠ꣄ꢞꢠꣁ
दण्डणा॑
ꢱꢾꢬ꣄ꢒꢬꢥꢶ / ꢭꢾꢓ꣄ꢒꣁ / ꢭꢴꢾꢒ꣄ꢒꢵ ꢥꢶꢬꢷꢒ꣄ꢰꢠꣁ / ꢭꢴꢾꢒ꣄ꢒꢵ ꢱꣂꢤꢥꣁ
स॑र्करनि / ल॑ख्का॑ / ल्ह॑क्का निरीक्षणा॑ / ल्ह॑क्का सोधना॑
ꢣꢹꢬ꣄ ꢭꢶꢓꢶꢥꢶ
दूर्लिखिनि
ꢡꢾꢬꢒꢸ ꢲꢥ꣄ꢥꢮ꣄
तेरकु हन्नव
ꢦꢒꢰꢮꢵꢥꢸꢥ꣄
पक्षवानुन
ꢱ꣄ꢬꢿꢠꢶ / ꢆꢥ꣄ꢥꢡꢶ
स्रेणि / उन्नति
ꢮꢶꢬ꣄ꢡꢵ ꢩꢸꢛꢶ / ꢥꢶꢱ꣄ꢡ ꢩꢸꢄ~
व्र्ताभुञि / निस्त भुइ~
ꢣꢳꢦꢳꣁ / ꢣꢳ ꢱꢾꢥꣁ / ꢦꢣ ꢱꢿꢥꣁ
दळपळा॑ / दळ सेना॑ / पद सेना॑
ꢬꢵꢙꢤꢵꢥꢶ
राजधानि
ꢂꢔ꣄ꢬꢵꢱꢥꢸꢦꢥ꣄ / ꢂꢔ꣄ꢬꢵꢱꢥꣁ
अग्रासनुपन / अग्रासना॑
ꢂꢔ꣄ꢬꢵꢱꢥꢵꢤꢶꢦꢡꢶ
अग्रासनाधिपति
ꢬꢶꢨꢾꢜ꣄ / ꢣꣁꢦ꣄ꢨꢶꢣꢾꢥꢶ / ꢆꢥ꣄ꢥ ꢒꢾꢬ꣄ꢥꢶ
रिबेट / दा॑प्बिद॑नि / उन्न क॑र्नि
ꢆꢦꢒꢬꢠꣁ
उपकरणा॑
ꢱ꣄ꢮꢫ ꢂꢟꢶꢒꢵꢬ꣄
स्वय अधिकार
ꢱ꣄ꢮꢗꢭ꣄ꢥꢶ
स्वचल्नि
ꢏꢠ꣄ꢜꢶꢫꢵꢳ꣄ / ꢏꢠ꣄ꢜꢮ꣄ꢫꢒ꣄ꢡꢶ
आ॑ण्टियाळ / आ॑ण्टव्यक्ति
ꢪꢵꢬ꣄
मार
ꢪꢵꢫ꣄ ꢩꢵꢰꣁ / ꢪꢵꢡ꣄ꢬꢸ ꢩꢵꢰꣁ
माय भाषा॑ / मात्रु भाषा॑
ꢫꣂꢙꢥꢵ ꢃꢫꣂꢔ꣄
योजना आयोग
ꢫꣂꢙꢥꣁ
योजना॑
ꢡꢶꢠ꣄ꢗꢶꢥꢶ / ꢂꢤꢶꢬꣂꢦꢠꣁ
तिण्चिनि / अधिरोपणा॑
ꢡꢶꢬꢶꢡꢪ꣄
तिरितम्
ꢣꢶꢮꢵꢭ꣄
दिवाल
ꢤꢶꢮꢵꢥ꣄
धिवान्
ꢆꢔ꣄ꢬꢮꢵꢡꢶ
उग्रवाति
ꢡꢶꢬ꣄ꢪꢵꢥ꣄ / ꢥꢶꢬ꣄ꢠꢫꣁ
तिर्मान् / निर्णया॑
ꢡꢷꢬ꣄ꢮꣁ
तीर्वा॑
ꢆꢦꢬꢵꢰ꣄ꢜ꣄ꢬꢦꢡꢶ
उपराष्ट्रपति
ꢆꢦꢮꢶꢢꢶ
उपविधि
ꢥꢶꢬ꣄ꢪꢭꢶꢒꢬꢠꣁ / ꢱꢸꢣ꣄ꢤꢶ ꢦꢵꢭꢥꣁ
निर्मलिकरणा॑ / सुद्धिपालना॑
ꢡꢵꢬꢸ ꢬꢾꢪ꣄ / ꢥꢵꢮꢸꢬꢾꢪ꣄ / ꢥꢮ꣄ꢒꢵ ꢬꢿꢪ꣄
तारु रेम / नावु रेम / नव्का रेम
ꢣꢸꢡꢥꢶꢮꢵꢱ꣄
दुत निवास
ꢣꢹꢡꣁ
दूता॑
ꢦꢬꢶꢱꢸꢣ꣄ꢤꢶ
परिसुद्धि
ꢥꢶꢳ꣄꣄ꢗꢶꢥꢶ
निळ्चिनि
ꢣꢾꢱꢩꢒ꣄ꢡꣁ
देसभक्ता॑
ꢣꢿꢱꢩꢒ꣄ꢡꢶ
देसभक्ति
ꢬꢵꢰ꣄ꢜ꣄ꢬꢸ / ꢣꢾꢱꢸ
राष्टरु / देसु
ꢬꢵꢰ꣄ꢜ꣄ꢬꢚꢠ꣄ꢞꢵꢮ꣄
राष्ट्रझण्डाव
ꢬꢵꢰ꣄ꢜ꣄ꢬꢔꢵꢥꢪ꣄ / ꢣꢾꢱꢸꢔꢷꢡ꣄
राष्ट्रगानम / देसुगीत
ꢬꢵꢰ꣄ꢜ꣄ꢬꢩꢵꢰꣁ
राष्ट्रभाषा॑
ꢗꢸꢥꢵꢮ꣄ / ꢥꢶꢬ꣄ꢮꢵꢗꢥ꣄
चुनाव / निर्वाचन
ꢦꢙꢾꢥ꣄ꢡꣁ
पज॑न्ता॑
ꢥꢶꢬ꣄ꢮꢵꢗꢥꢸ ꢩꢵꢔ꣄
निर्वाचनु भाग
ꢱꢖ꣄ꢒꢭꢥꢒꣁ / ꢮ꣄ꢫꢵꢱꢶꢒꢬ꣄ꢡꣁ
सङ्कलनका॑ / व्यासिकर्ता॑
ꢱꢖ꣄ꢒꢭꢥꣁ / ꢮ꣄ꢫꢵꢱ꣄
सङ्कलना॑ / व्यास
ꢬꣁꢒ꣄ꢒꢪ꣄ / ꢤꢥꢬꢵꢯꢶ
रोक्कम / धनराशि
ꢱꢾꢮ꣄ꢒꢥ꣄
सेव्कन
ꢣꢹꢬ ꣄ꢭꢶꢓ꣄ꢥꢶ
दूर्लिख्नि
ꢒꢵꢬ꣄ꢫꣁ / ꢒꢵꢪ꣄
कार्या॑ / काम
ꢒꢵꢬ꣄ꢫꢮꢵꢥ꣄ / ꢒꢵꢪ꣄ꢒꢾꢬ꣄ꢡꣁ / ꢒꢵꢬ꣄ꢫꢱ꣄ꢢꣁ
कार्यवान / काम्क॑र्ता॑ / कर्यस्था॑
ꢒꢵꢪꢸ ꢦꣁꢜ꣄ꢜꢾꢜ꣄ / ꢒꢵꢬ꣄ꢫꢕꢥꣁ
कामु पा॑ट्ट॑ट / कारयघना॑
ꢆꢣ꣄ꢣꢾꢱ꣄ / ꢱꢵꢪꢷꢦ꣄ꢫꢡꣁ / ꢆꢥ꣄ꢥ ꢆꢦꢶꢬ꣄
उद्देस / सामीप्यता॑ / उन्न उपिर
ꢱꢶꢖ꣄ꢔꣀꢡ꣄ / ꢱꢾꢖ꣄ꢔꢡꢶ / ꢱꢲꢮꢵꢱꢶ / ꢱꢾꢖ꣄ꢔꢮꢶ
सिङ्गैत / स॑ङ्गति / सहवासि / स॑ङ्गवि
ꢥꢔꢬꢱꢩꣁ / ꢔ꣄ꢬꢵꢪ ꢱꢖ꣄ꢕꣁ / ꢥꢔꢬ ꢦꢵꢭꢶꢒꣁ
नगरसभा॑ / ग्राम सङ्घा॑ / नगर पालिका॑
ꢗꢵꢭ꣄ꢗꢭꢥ꣄
चाल्चलन
ꢒ꣄ꢬꢶꢫꢵꢒ꣄ꢬꢪꣁ
क्रियाक्रमा॑
ꢪꢤ꣄ꢫ ꢱꢬ꣄ꢒꢵꢬ꣄
मध्य सर्कार
ꢆꢭꢵꢱꢸꢮꢵꢜ꣄ / ꢗꢭꢥ꣄ꢮꢵꢜ꣄
उलासुवाट / चलन्वाट
ꢥꢾꢰ꣄ꢜꢶ ꢥꢶꢮꢵꢬꢠꣁ
न॑ष्टि निवारणा॑
ꢥꢵꢔ꣄ꢬꢷꢔ꣄ / ꢱꢪ꣄ꢱ꣄ꢒ꣄ꢬꢸꢡꢶ
नाग्रीग / सम्स्क्रुति
ꢣꢶꢥ꣄ꢥꢸ ꢱꣁꢪ꣄ꢨꢸꢳꣁ
दिन्नु सा॑म्बुळा॑
ꢔ꣄ꢬꢵꢪ꣄ꢫꢙꢵꢡ꣄ / ꢱ꣄ꢢꢭꢷꢫꢙꢵꢡ꣄
ग्राम्यजात / स्थलीयजात
ꢬꢵꢰ꣄ꢜ꣄ꢬ ꢚꢠ꣄ꢞꢮ꣄ / ꢣꢾꢱꢸ ꢚꢠ꣄ꢞꢵꢮ꣄
राष्ट्र झण्डाव / देसु झण्डाव
ꢬꢵꢰ꣄ꢜ꣄ꢬꢔꢷꢜ꣄ / ꢣꢾꢱꢸꢔꢷꢜ꣄
राष्ट्रगीत / देसुगीत
ꢬꢵꢰ꣄ꢜ꣄ꢬ ꢩꢒ꣄ꢡꢶ / ꢣꢾꢱꢸꢩꢒ꣄ꢡꢶ
राष्ट्र भक्ति / देसुभक्ति
ꢥꢵꢔꢬꢷꢒꢡꣁ / ꢣꢾꢱꢶꢫꢡꣁ
नागरीकता॑ / देसुयता॑
ꢭꣂꢒ꣄ ꢱꢩꣁ
लोक्सभा॑
ꢬꢵꢰ꣄ꢜ꣄ꢬꢸ / ꢣꢾꢱ꣄
राष्ट्रु / देस
ꢒꢵꢬ꣄ꢫ ꢗꢵꢭꢥꣁ / ꢮꣀꢩꢮ꣄
कार्य चालना॑ / वैभव
ꢒꢵꢬ꣄ꢫꢒ꣄ꢬꢪꣁ
कार्यक्रमा॑
ꢲꢥ꣄ꢥꢮꢸ / ꢥꢶꢕꢶ
हन्नवु / निघि
ꢥꢶꢡꢶ ꢮꢶꢩꢵꢔ
नितिविभाग
ꢥꢶꢦꢥ꣄ꢣꢥꣁ
निपन्दना॑
ꢥꢶꢬ꣄ꢮꢵꢲ꣄
निर्वाह
ꢒ꣄ꢬꢪꣁ
क्रमा॑
ꢥꢶꢬ꣄ꢮꢵꢒ꣄
निर्वाक्
ꢥꢶꢬꢸꢦꢠꣁ / ꢦ꣄ꢬꢪꢵꢠ꣄ / ꢬꢹꢙꢸ
निरुपणा॑ / प्रमाण / रूजु
ꢱ꣄ꢬꢿꢠꢶ
स्रेणि
ꢢꢵꢪꢸ ꢒꢬꣁ
थामु करा॑
ꢱ꣄ꢢꢵꢦꢥꣁ
स्थापना॑
ꢫꣂꢒ꣄ꢫꢡꣁ
योक्यता॑
ꢥꢷꢡꢶꢦꢡꢶ / ꢥꢶꢫꢵꢫꢵꢤꢶꢦꢡꢶ
नीतिपति / नियायाधिपति
ꢥꢷꢡꢶꢱ꣄ꢢꢭ꣄
नीतिस्थल
ꢆꢦꢫꣂꢔꢸ ꢮꢱ꣄ꢡꢸꢥ꣄ / ꢥꢸꢔꢥ꣄ ꢮꢱ꣄ꢡꢸꢥ꣄
उपयोगु वस्तुन / नुगन वस्तुन
ꢆꢦꢫꣂꢔ / ꢥꢸꢔꢶꢥꢶ
उपयोग / नुगिनि
ꢡꢸꢬ꣄ꢥꢶ / ꢦ꣄ꢬꢾꢮ꣄ꢯ꣄
तुर्नि / प्रेवुश
ꢄꢬ꣄ꢒꢜ꣄ / ꢱꢖ꣄ꢔꢜ꣄
इर्कट / सङ्गट
ꢮꢔꣁ ꢦꢬꢶ ꢱꣂꢣꢥꣁ
वगा॑परिसोदना॑
ꢱꢲꢫꣁꢔ꣄
सहयोग
ꢮꢜꣁ
वटो
ꢣꢸꢔꢵꢳꢸ ꢲꢥ꣄ꢥꢮ꣄ / ꢣꢸꢔꢵꢳꢸ ꢩꢬ꣄ꢡꣁ
दुगाळु हन्नव / दुगाळु भर्ता॑
ꢣꢸꢔꢵꢳ꣄꣄
दुगाळ
ꢱꢿꢥꣁ / ꢦꢳꣁ
सेना॑ / पळा॑
ꢨꢶꢭ꣄ / ꢬꢱꢷꢡꢸ
बिल् / रसीतु
ꢙꢵꢦꢶꢡꣁ / ꢙꢦ꣄ꢡꣁ
जापिता॑ / जप्ता॑
ꢱꢪ꣄ꢩꢮꢥꣁ
सम्भावना॑
ꢲꢥꢶ
हनि
ꢚꢾꢞꢵ ꢂꢫ꣄ꢣꢸ / ꢱꢿꢥꢵ ꢣꢳꢮꢵꢞꢸꢥ꣄
झ॑डा अय्दु / सेना दळवाडुण
ꢱꢿꢥꢵꢦꢡꢶ / ꢣꢭꢒꢬ꣄ꢡꣁ
सेनापति / दलकर्ता॑
ꢣꢿꢥꢵ ꢣꢳ꣄
सेनादळ
ꢦꢣꢵꢬ꣄ꢢꢸꢥ꣄ / ꢩꣁꢠ꣄ꢠꢪꢸꢥ꣄
पदार्थुन / भा॑ण्णमुन
ꢒꢭꢵꢗꢵꢬ꣄ / ꢱꢪ꣄ꢱ꣄ꢒ꣄ꢬꢸꢡꢶ
कलाचार् / सम्स्क्रुति
ꢆꢣ꣄ꢫꣂꢔ꣄
उद्योग्
ꢒꢵꢪ꣄ ꢲꢾꢞ꣄ꢠꢶ
काम ह॑ड्णि
ꢒꢪ ꣄ꢪꢬ꣄ꢗꢶꢥꢶ
काम्मरिनि
ꢒꢵꢪꢸ ꢙꢿꢰ꣄ꢜꢦꢥ꣄
कामु जेष्टपन
ꢒꢵꢬ꣄ꢫꢵꢮꢵꢥ꣄
कार्यावान्
ꢦꢣꢮꢶ
पदवि
ꢦꢣꢮꢶ ꢲꢸꢡ꣄ꢬꢵꢮ꣄
पदवि हुत्राव
ꢦꢣꢮꢶ ꢲꢶꢖ꣄ꢔꢵꢮ꣄
पदवि हिङ्गाव
ꢦꢣꢮꢶꢓꢳ꣄ꢳꢶꢥꢶ
पदवि खळ्ळिनि
ꢦꢣꢮꢶ ꢒꢵꢭ
पदविकाल
ꢚꢜ꣄ꢢꢶ / ꢏꢣ꣄ꢣꢶ
झट्थि / ओद्दि
ꢥꢶꢪ꣄ꢦꢶꢥꢶ / ꢱꢪ꣄ꢱ꣄ꢒꢬꢠꣁ
निम्पिनि / सम्स्करणा॑
ꢥꢶꢪ꣄ꢦꢶꢥꢶ ꢨꢵꢤ꣄ꢫꢡꣁ
निम्पि निबाध्यता॑
ꢩꢬ꣄ꢡꢶ / ꢨꣁꢣꢸꢭ꣄
भर्ति / बा॑दुल
ꢦꢛ꣄ꢗꢶꢒꣁ / ꢥꢶꢬ꣄ꢣꢿꢱꣁ
पञ्चिका॑ / निर्देसा॑
ꢦꢛ꣄ꢗꢶꢒꣁ ꢦꢡ꣄ꢡꢬ꣄
पञ्चिका पत्तर
ꢱꢾꢡ꣄ꢡꢬ꣄
स॑त्तर
ꢩꣁꢔꢸꢥꢵꢬ꣄
भा॑गुनार
ꢱꢶꢒ꣄ꢰꢵ ꢪꢵꢣ꣄ꢫꣁ
सिक्षा माद्यो
ꢦꢬꢶꢦꢵꢭꢥꣁ
परिपालना॑
ꢦꢬꢶꢱꢷꢭꢥꣁ
परिसीलना॑
ꢱꢸꢦꢬ꣄ꢗꢶ
सुपर्चि
ꢦꢬꢶꢮꢬ꣄ꢡꢥꣁ
परिवर्तना॑
ꢥꢶꢤꢶ ꢆꢥ꣄ꢥꣁ / ꢧꢸꢬꣁ ꢧꢸꢬ꣄ꢥꢵꢱ꣄ꢡꢾ
निधिउन्ना॑ / फुरा॑ फुर्नास्ते
ꢦꢬ꣄ꢬꢸ / ꢙꢥꢶ
पर्रु / जनि
ꢂꢦꢲꢬꢠꣁ
अपहरणा॑
ꢦꢥꢶ ꢱꢶꢛ꣄ꢗꢵꢮ꣄
पनि सिनन्चाव
ꢬꢒ꣄ꢰꢥꣁ
रक्षना॑
ꢭꣂꢒ꣄ꢱꢩꣁ
लोक्सभा॑
ꢣꢹꢡ꣄ ꢆꢡ꣄ꢦꢵꢣꢥꢱꢵꢭꣁ
दूत उत्पादनसाला॑
ꢗꢸꢥꢵꢮꢸ ꢦ꣄ꢬꢗꢵꢬ꣄
चुनावु प्रचार
ꢙꢪꢷꢥ
जमीन
ꢩꢬ꣄ꢡꢶ
भर्ति
ꢦ꣄ꢬꢤꢵꢥ꣄ ꢪꢥ꣄ꢡꢶꢬꢶ
प्रधान्मन्तिरि
ꢨꣁꢣꢸꢭ꣄ ꢮꢵꢡꢶ
बा॑दुल्वाति
ꢦ꣄ꢬꢡꢿꢱꢸ
प्रतेसु
ꢦ꣄ꢬꢩꢸ
प्रभु
ꢦ꣄ꢬꢙꣁ
प्रजा॑
ꢮꢶꢩꢵꢔ
विभाग
ꢂꢥꢸꢨꢥ꣄ꢤꢸ
अनुबन्धु
ꢦꢱ꣄ꢒꢜ꣄ꢮꢬ꣄ꢔꢸ ꢱꢪꢹꢲꢸ / ꢦꢱ꣄ꢒꢜ꣄ ꢦꣁꢞꢾ ꢱꢪꢹꢲꢸ
पस्कट्वरगु समूहू / पस्कट बा॑ड॑ समूहु
ꢙꢥ꣄ꢪꢵꢥ꣄ꢣꢬꢪꢸ
जन्मान्दरमु
ꢦꢱ꣄ꢒꢞꢸꢱꢪꢹꢲꢸ
पस्कडु समूहु
ꢦꢸꢒꢵꢬ꣄ / ꢂꢩꢶꢫꣂꢔ
पुकार् / अभियोग
ꢥꣁꢮ꣄ꢮꢒꢬꢠꣁ / ꢥꣁꢮ꣄ꢮꢒꢾꢬ꣄ꢥꢶ
नोव्वकरणा॑ / ना॑व्व क॑र्नि
ꢒ꣄ꢬꢵꢥ꣄ꢡꢶ
क्रान्ति
ꢮꢣꢥ꣄ꢡꢶ
वदन्ति
ꢮꢶꢗꢵꢬꢠꣁ / ꢂꢥ꣄ꢮꢿꢱꢥꣁ
विचारणा॑ / अन्वेसना॑
ꢱꢬ꣄ꢒꢵꢬꢸ ꢢꢵꢪ꣄
सर्कारु थाम
ꢮꢶꢱ꣄ꢡꢵꢬ꣄ / ꢮꢶꢭꢵꢱ꣄
विस्तार् / विलास्
ꢨꢲꢸ ꢱꢖ꣄ꢓ꣄ꢫꢡꣁ
बहु सङ्ख्यता॑
ꢂꢤꢶꢒꢡꣁ / ꢆꢦꢶꢬ꣄
अधिकता॑ / उपिर
ꢬꢵꢙꢵꢤꢶꢬꢙꣁ / ꢪꢴꢵꢬꢵꢜ꣄ / ꢱꢵꢪ꣄ꢬꢵꢜ꣄ / ꢗꢒ꣄ꢬꢮꢬ꣄ꢡꢶ
राजाधि रजा॑ / म्हाराट / साम्राट / सक्रवर्ति
ꢭꢵꢪ꣄ꢬꢵꢙ꣄ꢫꢸ / ꢱꢵꢪ꣄ꢬꢵꢙ꣄ꢫꢸ
लाम्राज्यु / साम्राज्यु
ꢪꢲꢵ ꢱꢩꣁ
महा सभा॑
ꢥꢔꢬꢦꢵꢭꢶꢒꣁ
नगर पालिका॑
ꢭꢾꢞ꣄ꢙꢬ꣄ / ꢮ꣄ꢫꢒ꣄ꢡꢶ ꢭꢴꢾꢒ꣄ꢒꢵ ꢦꢸꢱ꣄ꢡꢮ꣄ / ꢦꢾꢬꢿꢜ꣄
ल॑ड्जर / व्यक्ति ल्ह॑क्का पुस्तव / पेरेट
ꢱꢵꢤꢵꢬꢥꢱꢩꣁ / ꢱꢵꢬ꣄ꢮꢙꢥꢶꢒ꣄ ꢱꢩꣁ
साधारण सभा॑ / सार्वजनिक सभा॑
ꢱꢵꢬ꣄ꢮꢙꢥꢶꢒ꣄ ꢮꢶꢩꢵꢔ꣄ / ꢭꣁꢒ ꢮꢶꢩꢵꢔ꣄
सार्वजनिक्विभग / लोग विभाग
ꢭꣂꢒ ꢔ꣄ꢬꢥ꣄ꢢꢵꢭꢫꣁ
लोक ग्रन्थालया॑
ꢱꢵꢤꢵꢬꢠ ꢮꢶꢬꢵꢪ꣄
साधारण विराम
ꢃꢬ꣄ꢢꢶꢒ ꢱ꣄ꢢꢶꢡꢶ
आर्थिक सथिति
ꢒꢵꢬ꣄ꢫꢩꢵꢬ꣄
कार्यभार
ꢙꢥꢶ / ꢦ꣄ꢬꢮꢬ꣄ꢡꢶ
जनि / प्रवर्ति
ꢱ꣄ꢦꢬ꣄ꢤꢥ꣄ / ꢦꣁꢥ꣄ꢡꢶ
स्पर्धन / पा॑न्ति
ꢫꢸꢣ꣄ꢤꢸ
युद्धु
ꢃꢬ꣄ꢩꢵꢜꣁ
आर्भाटो
ꢃꢬ꣄ꢩꢵꢜꣁ ꢒꢾꢬ꣄ꢥꢵꢬ꣄ / ꢫꣁꢣ꣄ꢤꢸ
आर्भाटा॑ क॑र्नार / योद्धु
ꢙꢥ ꢱꢖ꣄ꢓ꣄ꢫꣁ
जन सङ्ख्या॑
ꢪꢤ꣄ꢫꢱꢬ꣄ꢒꢵꢬ꣄ / ꢒꢿꢥ꣄ꢣ꣄ꢬ ꢱꢬ꣄ꢒꢵꢬ꣄
मध्यसर्कार / केन्द्र सर्कार
ꢃꢒꢭꢥꣁ
आकलना॑
ꢪꢹꢭ꣄ꢫ ꢥꢶꢬ꣄ꢤꢵꢬꢠꣁ
मूल्य निर्धारणा॑
ꢦꢬꢶꢱ꣄ꢬꢵꢪ ꢱꢸꢭ꣄ꢒꣁ / ꢱꢪ꣄ꢩꢵꢮꢥꣁ
परिस्राम सुल्का॑ / सम्भावना॑
ꢪꢤꢸ ꢥꢶꢬꣁꢤꢥꣁ
मधु निरोधना॑
ꢪꢥ꣄ꢡ꣄ꢬꢶ / ꢱꢗꢶꢮꣁ / ꢂꢪꢵꢡ꣄ꢫꣁ
मन्त्रि / सचिवा॑ / अमात्या॑
ꢥꢴꢵꢪꢾꢥ꣄ꢥꢶ
न्हाम॑न्नि
ꢦꢸꢥꢬ꣄ꢧꢸꢭꢥꣁ
पुनर्फुलना॑
ꢦꢸꢥꢬ꣄ ꢙꢷꢮꢥꣁ
पुनर जीवना॑
ꢬꢙꣁ / ꢬꢵꢜ
रजा॑ / राट
ꢦꢶꢬꢵꢬ꣄ꢢꢥꢵ ꢦꢡ꣄ꢬꢸ / ꢒꣁꢬꢶ ꢦꢡ꣄ꢬꢸ
पिरार्थना पत्रु / का॑रि पत्रु
ꢪꢲꢵ ꢥꢔꢬꢦꢵꢭꢶꢒꣁ
महा नगरपालिका॑
ꢱꢪ꣄ꢪꢿꢭꢥꣁ
सम्मेलना॑
ꢬꢵꢙ꣄ꢫ ꢱꢬ꣄ꢒꢵꢬ꣄
प्रान्तिय सर्कार
ꢦ꣄ꢬꢵꢥ꣄ꢡꢸ
प्रान्तु
ꢱꢵꢪ꣄ꢬꢵꢜ
साम्राट
ꢱꢵꢪ꣄ꢫꢮꢵꢣ꣄
साम्यवाद
ꢙꢶꢭ꣄ꢭꣁ
जिल्ला॑
ꢪꢵꢥ꣄ꢫꢪ꣄
मान्यम्
ꢦꢸꢥꢬ꣄ ꢦ꣄ꢬꢵꢦ꣄ꢡꢶ
पुनर्प्राप्ति
ꢒꢮ꣄ꢥꢶ / ꢆꢬꢵꢮ꣄ / ꢒꣁꢮ꣄ ꢣꢵꢫꣁ / ꢱꢿꢱ꣄
कव्नि / उराव / का॑व दाया॑ / सेश
ꢦ꣄ꢬꢡꢶꢥꢶꢜꢶ
प्रतिनिति
ꢱꢵꢪ꣄ꢬꢵꢜꢸ ꢦꢵꢭꢥꣁ
साम्राटु पालना॑
ꢪꢸꢣ꣄ꢬꣁ
मुद्रा॑
ꢪꢹꢭꢸꢤꢥ꣄
मूलुधन
ꢪꢸꢒ꣄ꢫ ꢪꢥ꣄ꢡꢶꢬꢶ
मुक्य मन्तिरि
ꢪꢹꢭꢤꢥꢮꢵꢥ꣄
मूलधनवान
ꢤꢥꢮꢵꢥꢸꢦꢥ꣄
धनवानुपन
ꢦꢸꢥꢬ꣄ ꢮꢶꢗꢵꢬ ꢦ꣄ꢬꢵꢬ꣄ꢡꢥꣁ
पुनर्विचार प्रार्तना॑
ꢦ꣄ꢬꢵꢒ꣄ꢦ꣄ꢬꢡꢶ
प्राक्प्रति
ꢦꢹꢬ꣄ꢮꢵꢥꢸꢪꢵꢥ꣄
पूर्वानुमान
ꢧꣀꢭ ꢨꢵꢡ꣄ꢫꢡꣁ
फैल बात्यता॑
ꢂꢩꢶꢮꢶꢬꢸꢣ꣄ꢤꢶ
अभिविरुद्धि
ꢥꢷꢮꢶ / ꢪꢹꢭꢤꢥꢪꢸ
नीवि / मूलधनमु
ꢪꢹꢭꢮꢱ꣄ꢡꢸ
मूलवस्तु
ꢃꢖ꣄ꢔꢬꢒ꣄ꢯꢒꣁ
आङ्गरक्षका॑
ꢪꢶꢜ꣄ꢜꣁ / ꢪꢛ꣄ꢗꢸ / ꢮꢿꢣꢶꢒꣁ
मिट्टा॑ / मञ्चु / वेदिका॑
ꢂꢩꢶꢮ꣄ꢬꢸꢣ꣄ꢤꢶ
अभिव्रुद्धि
ꢪꢿꢜꢶꢥꢸ ꢮꢶꢤꢵꢥ꣄ ꢱꢩꣁ
मेटिनु विधान सभा॑
ꢆꢛ꣄ꢗ ꢂꢤꢶꢒꢵꢬꢶ
उञ्च अधिकारि
ꢥꢶꢬ꣄ꢮꢵꢲ꣄ / ꢥꢶꢫꢥ꣄ꢡ꣄ꢬꣁ
निर्वाह / नियन्त्रा॑
ꢦ꣄ꢬꢨꢥ꣄ꢤꢒꣁ / ꢪꢾꢜꢸ ꢥꢶꢮꢵꢲꢶ
प्रबन्धका॑ / मेटु निर्वाहि
ꢆꢗ꣄ꢗ ꢂꢙ꣄ꢛꢵꢒꢵꢬ꣄
उच्च आजञाकार
ꢆꢣ꣄ꢤꢬꢠꣁ / ꢆꢭ꣄ꢭꢾꢲꢥꣁ / ꢂꢮꢡꢵꢬꢠꣁ / ꢂꢮꢡꢵꢬꢶꢡ ꢮꢵꢒ꣄ꢫꢸ
उधारणा॑ / उल्लेहना॑ / अवतारणा॑ / अवतारित वाक्यु
ꢡꢣꢾꢮ
तदेव
ꢪꢤ꣄꣄ꢫ ꢱꢬ꣄ꢒꢵꢬ꣄
मध्य सर्कार
ꢂꢥꢸꢮꢵꢣꢒꣁ / ꢡꢬ꣄ꢙꢪꣁ ꢒꢾꢬ꣄ꢥꢵꢬ꣄
अनुवादका॑ / तर्जमा॑ क॑र्नार
ꢫꢸꢣ꣄ꢤꢸ / ꢚꢾꢞꣁ / ꢪꢵꢬ꣄
युद्धु / झ॑डा॑ / मार
ꢬꢠꢶ / ꢬꢵꢠꢶ
रणि / राणि
ꢦꢭꣁ / ꢱꢿꢥꣁ
पला॑ / सेना॑
ꢬꢵꢙ ꢣꢸꢬꣂꢲꢶ
राज दुरोहि
ꢬꢵꢙꢫ ꢱꢩꣁ / ꢪꢾꢜꢸ ꢱꢩꣁ
राजयसभा॑ / मेटु सभा॑
ꢬꢙꢶꢥꢪꣁ
रजिनमा॑
ꢬꢵꢰ꣄ꢜ꣄ꢬꢦꢡꢶ
राष्ट्रपति
ꢪꢵꢪꢹꢭ꣄ / ꢭꢾꢛ꣄ꢗꢪ꣄
मामूल् / लेञ्चम्
ꢭꣁꢒ꣄ ꢱꢩꣁ
लोक सभा॑
ꢮꢶꢡ꣄ꢡꢒꣁꢰ꣄
वित्तकोष
ꢲꢥ꣄ꢥꢮꢸ ꢱꢖ꣄ꢒ꣄ꢬꢲꢥꣁ / ꢮꢱꢸꢭ꣄
हन्नवु सङ्क्रहना॑ / वसुल
ꢡꢵꢭꢹꢒꢵ
तालूका
ꢣꢵꢱꢶꢭ꣄ꢣꢵꢬ꣄
दासिल्दार
ꢦꢶꢬꢵꢥ꣄ꢡ꣄ꢫꢸ
पिरान्त्यु
ꢦꢶꢬꢵꢥ꣄ꢡꢶꢫ ꢩꢵꢰꣁ
पिरान्तिय भाषा॑
ꢩꢶꢫꢵꢬ꣄ / ꢮꢵꢠꢶꢙ꣄ꢫꣁ
भियार् / वाणिज्या॑
ꢩꢶꢫꢵꢬꢸ ꢮꢶꢡ꣄ꢡ ꢒꣁꢰ꣄ / ꢮꢠꢶꢒ ꢮꢶꢡ꣄ꢡ ꢒꣁꢰ꣄
भियारु वित्त कोष / वणिक वित्त कोष
ꢩꢶꢫꢵꢬꢸ ꢱꢸꢭ꣄ꢒꣁ / ꢮꢠꢶꢒ ꢱꢸꢭ꣄ꢒꣁ
भियारुसुल्का॑ / वणिक सुल्का॑
ꢒꢶꢪ꣄ꢮꢣꢥ꣄ꢡꢶ / ꢮꢣꢥ꣄ꢡꢶ / ꢙꢥꢱ꣄ꢬꢸꢡꢶ
किम्वदन्ति / वदन्ति / जनस्रुति
ꢩ꣄ꢫꢵꢬ꣄
भ्यार
ꢂꢮ꣄ꢥꢶ
अव्नि
ꢡꣂꢬꢠ꣄ / ꢒ꣄ꢬꢪꣁ / ꢱ꣄ꢬꢿꢠꢶ
ता॑रण / क्रमा॑ / स्रेणि
ꢱꢸꢭ꣄ꢒꢥꢶꢬ꣄ꢠꢫꢸ
सुल्कनिर्णया॑
ꢆꢗ꣄ꢭꢵꢮ꣄ / ꢙꣁꢞꢸꢪ꣄ꢨꢸꢭ꣄
उच्लाव / जा॑डुम्बुल
ꢆꢗ꣄ꢭꢵꢮꢸ ꢱꢸꢭ꣄ꢒꣁ / ꢆꢗ꣄ꢭꢵꢮꢸ ꢒꢬꣁ
उच्लावु सुल्का॑ / उच्लावु करा॑
ꢬꢵꢙ꣄ꢫ ꢃꢣꢵꢫꢸ
राज्य आदायु
ꢥ꣄ꢫꢥ꣄ꢡ꣄ꢬꢠꣁ / ꢦ꣄ꢬꢡꢶꢨꢥ꣄ꢤꢸ / ꢮꢔꣁꢡꣁꢔꣁ
न्यन्त्रणा॑ / प्रतिबन्धु / वगा॑ता॑गा॑
ꢮꢶꢡ꣄ꢡ ꢭꢿꢓꢸ / ꢦ꣄ꢬꢵꢒ꣄ ꢭꢾꢓꢥꣁ
वित्त लेखु / प्राक लेखना॑
ꢥꢶꢦꢸꢠꣁ
निपुणा॑
ꢙꣀꢥ ꢧꢶꢬ꣄ꢥꢶ / ꢦ꣄ꢬꢣꢒ꣄ꢰꢥꣁ
जैन फिर्नि / प्रदक्षना॑
ꢮꢒ꣄ꢒꢷꢭ꣄
वक्कील्
ꢬꢹꢟꢶ
रूढि
ꢪꢵꢬ꣄ꢒꢣꢬ꣄ꢱꢶ / ꢮꢵꢜ꣄ ꢣꢾꢒ꣄ꢒꢞ꣄ꢠꢵꢬ꣄
मार्ग दर्सि / वाट देक्कड्णार
ꢒꢾꢬꢥ꣄ꢮꢵꢜ꣄
क॑रन्वाट्
ꢡꢸꢔꢵꢳ꣄
तुगाळ
ꢣꢬꢶꢣ꣄ꢬꢡꣁ / ꢣꢾꢭ꣄ꢞꢶꢬꢶꢦꢥ꣄
दरिद्रता॑ / द॑ल्डिरिपन
ꢆꢔ꣄ꢬꢦꢥ꣄
उग्रपन
ꢮꢵꢒ꣄ ꢣꢾꢥꢵꢬ꣄ / ꢪꢡꢣꢵꢡꣁ
वाक् द॑नार / मतदाता॑
ꢮꣂꢜ꣄ / ꢪꢡꢣꢵꢥ꣄ / ꢮꢵꢔ꣄ꢣꢵꢥ꣄
वोट / मतदान / वाग्दान
ꢮꢵꢒꢸ ꢦꢡ꣄ꢬꢸ
वाकु पत्रु
ꢨꢜ꣄ꢒꢾ
बट्क॑
ꢮꢵꢡꢶ
वाति
ꢮꢵꢬ꣄ꢱꢸ / ꢆꢡ꣄ꢬꢵꢤꢶꢒꢵꢬꢶ
वार्सु / उत्राधिकारि
ꢱꢪꢶꢡꢶ
समिति
ꢂꢥꢸꢦꢵꢡ꣄
अनुपात
ꢸꢮꢶꢗꢵꢬꢠꣁ
विचारणा॑
ꢱ꣄ꢮꢵꢡꢥ꣄ꢡ꣄ꢬꢸ
स्वातन्त्रु
ꢱꣁꢞ꣄ꢥꢶ / ꢱꣁꢞ꣄ꢮꢵꢬ꣄
सा॑ड्नि / सा॑ड्वार
ꢱꣂꢞꢶ
सोडि
ꢮꢶꢦꢡ꣄ꢡꢸ
विपत्तु
ꢮꢵꢫꢸꢱꢾꢥꣁ
वायुसेना॑
ꢧꢵꢞ꣄
फाड्
ꢨꢶꢭ꣄ꢭꣁ
बिल्ला॑
ꢪꣁꢭꢸ ꢙꢦ꣄ꢡꣁ / ꢪꣁꢭꢸ ꢂꢜ꣄ꢜꢮꢥꣁ
मोलुजप्ता॑ / मोलु अट्टवना॑
ꢮꢶꢮꢵꢣ꣄ / ꢮꢵꢔ꣄ꢮꢶꢮꢵꢣ꣄
विवाद / वाग्विवाद
ꢆꢡ꣄ꢱꢮ꣄ / ꢮꣀꢩꢮ꣄
उत्सव / वैभव
ꢦ꣄ꢬꢡꢶꢯꢡ꣄ / ꢦ꣄ꢬꢡꢶꢯꣁꢡꢸ
प्रतिशत / प्रतिशा॑तु
ꢮꢶꢙ꣄ꢛꢵꢦꢥꣁ / ꢦ꣄ꢬꢒꢵꢬꢰꢥꣁ
विजञापना॑ / प्रकाषना॑
ꢮꢶꢒ꣄ꢒꢶꢥꢶ ꢒꢬꣁ
विक्किनि करा॑
ꢣꢬꣁ
दरा॑
ꢂꢩꢾꢒ꣄ꢯꢒꣁ
अभेक्षका॑
ꢂꢩꢾꢒ꣄ꢰꢸ
अभेक्षु
ꢒꢵꢪ꣄ ꢲꢶꢨ꣄ꢨꢜ꣄ꢠꢶ
काम्हिब्ट्णि
ꢒ꣄ꢬꢸꢰꢶ
क्रुषि
ꢮꢶꢥ꣄ꢫꢵꢱ꣄
विन्यास
ꢮꣂꢜ꣄ / ꢪꢡꢣꢵꢥ꣄ / ꢮꢵꢔ꣄ꢣꢵꢥ꣄
वोट / मतदान / वाग्दान
ꢭꣁꢒ ꢡꢥ꣄ꢡ꣄ꢬꢸ / ꢦ꣄ꢬꢙꢵ ꢡꢥ꣄ꢡ꣄ꢬꢸ / ꢙꢥ ꢡꢥ꣄ꢡ꣄ꢬꢸ
लोक तन्त्रु / प्रजा तन्त्रु / जन तन्त्रु
ꢙꢥꢵꢣꢶꢦꢡꢶ
जनादिपति




Script - Profession


ꢆꢣ꣄ꢫꣁꢔ꣄ꢥ꣄ ꢒꢶꢥꢸ ꢆꢣ꣄ꢫꣁꢔꢸꢥꢸ ꢆꢦꢒꢬꢠꣁ
उद्योगुन किनु उद्योगुनु उपकरणा॑
ꢂꢖ꣄ꢔꢸꢱꣁ
अङ्गुसा॑
ꢪꢸꢣ꣄ꢬꢠꢱꢵꢭꣁ
मुद्रणसाला॑
ꢥꢶꢪ꣄ꢦꢶꢥꢶ / ꢪꢸꢣ꣄ꢬꢠꣁ
निम्पिनि / मुद्रणा॑
ꢥꢶꢪ꣄ꢦꢶꢥꢶꢮꢵꢥ꣄ / ꢪꢸꢣ꣄ꢬꢠꣁ ꢒꢾꢬ꣄ꢥꢵꢬ꣄
निम्पिनिवान / मुद्रणा॑ क॑र्नार
ꢦꢡ꣄ꢬꢮꢵꢲꢒꣁ / ꢦꢡ꣄ꢬꢮꢵꢲꣁ / ꢭꢾꢓꢸꢮꢵꢥ꣄
पत्रवाहका॑ / पत्रवाहा॑ / लेखुवान
ꢮꢵꢭ꣄ꢮꢸ / ꢚꢔꢶ ꢲꢸꢔꢸꢞꢵꢮ꣄
वाल्वु / झगि हुगुडाव
ꢮꢬꢶꢞꣁ / ꢮꢫꢞꢾ
वरिडा॑ / वयड॑
ꢥꢶꢥꢵꢮ꣄ ꢒꢾꢬ꣄ꢥꢵꢮ꣄
निनाव क॑र्नाव
ꢒꢡ꣄ꢒꣁ / ꢒꢒ꣄ꢒꣁ
कत्का॑ / कक्का॑
ꢧꢱꢭ꣄ ꢒꢜꢱ꣄ꢡꢾ
फसल कटस्ते
ꢲꣁꢞꢫ꣄ꢡ꣄
हा॑डय्त
ꢃꢠꢶ
आणि
ꢄꢜ꣄ꢒꢶ
इट्कि
ꢔꢮ꣄ꢬꢶ / ꢔꣁꢭ꣄ꢭꢬꢶꢥ꣄ / ꢔꣁꢮ꣄ꢭꢶ
गव्रि / गोल्लरिन / का॑व्लि
ꢔꢮ꣄ꢬꢸ / ꢔꣁꢮ꣄ꢭꣁ
गव्रु / गा॑व्ला॑
ꢱꢪ꣄ꢫꣂꢙꢒꣁ
स्म्योजका॑
ꢃꢱꢥꣁ / ꢦꢷꢝꢪ꣄
आसना॑ / फीटम
ꢥꢶꢮꢵꢬꢠꣁ
निवारणा॑
ꢡꢵꢡ꣄ / ꢡꢵꢒ꣄
तात / ताक
ꢆꢬ꣄ꢮꢬꣁ / ꢆꢬꣁ
उर्वरा॑ / उरा॑
ꢤꢸꢭ꣄ꢞꣁ / ꢡꢹꢬ꣄
धुल्डा॑ / तूर
ꢒꢱꢮ꣄ꢜꢶ / ꢔꣁꢱꢸꢥꢵꢮꢸ ꢣꢾꢫ꣄ꢞꣁ
कसव्टि / ग॑सुनावु द॑य्डा॑
ꢗꢸꢭ꣄ꢭꣁ
चुल्ला॑
ꢙꢸꢥꢡ꣄ꢥꢵꢬ꣄ / ꢙꢸꢥꢡ꣄ꢮꢵꢥ꣄ / ꢥꢖ꣄ꢔꢸꢥꢵꢬ꣄ / ꢒꢬ꣄ꢰ꣄ꢠꢵꢬ꣄ / ꢒ꣄ꢬꢸꢰꢶ
जुनत्नार / जुनत्वान / नङ्गुनार / कर्ष्णार / क्रुषि
ꢜꢖ꣄ꢒꢸ
टङ्कु
ꢱꢶꢮꢶ
सिवि
ꢧꢸꢥꢳꢶ
फुनळि
ꢱꢿꢮꣁ
सेवो
ꢢꢿꢡꢸ ꢱꢡ꣄ꢡꢸ / ꢱꢿꢥ꣄
खेतु सत्तु / म्स्तु / सेन्
ꢒꢜꢶ ꢣꢾꢮ꣄ꢱꢶꢥꢶ / ꢪꢶꢳꢞ꣄ꢠꢶ
कटि द॑व्सिनि / मिळड्णि
ꢱꢶꢖ꣄ꢔꢬ꣄ꢭꢶꢥꢶ
सङ्गर्लिनि
ꢤꣁꢥꢶ ꢦꢛ꣄ꢙꢷꢒꢬꢠꣁ / ꢤꣁꢥꢶ ꢤꢾꢬ꣄ꢥꢶ
धा॑नि पञ्जीकरणा॑ / धा॑नि ध॑र्नि
ꢬꢹꢦꢸ ꢦꢛ꣄ꢙꢷꢒꢬꢠꣁ / ꢬꢹꢦꢸ ꢤꢾꢬ꣄ꢥꢶ
रूप पञ्जीकरणा॑ / रूपु धेर्नि
ꢣꣁꢮ꣄ꢞꢸꢥꢵꢬ꣄ / ꢱꢵꢬꢤꢶ
दा॑व्डुनार / सारथि
ꢣꣂꢠꢶ / ꢥꢮ꣄ꢒꣁ
दोणि / नव्का॑
ꢒꢾꢜ꣄ꢜꣁ
क॑ट्टा॑
ꢒꢾꢜ꣄ꢜꢾ ꢦꢛ꣄ꢗꢭ꣄
क॑ट्ट॑ पञ्चल्
ꢒꢾꢜ꣄ꢜꢾ ꢬꢹꢦ꣄ ꢒꢾꢬ꣄ꢥꢶ
क॑ट्ट॑ रूप क॑र्नि
ꢔꢪ꣄ꢙꢶ
गम्जि
ꢔꢪ꣄ꢗꢸꢥꢵꢬ꣄
गम्चुनार्
ꢱꢹꢞ꣄ ꢲꢥꢱ꣄ꢡꢾ
सूड हनते
ꢤꢾꢥ꣄ꢣ꣄ꢫꢵꢮ꣄
घ॑न्द्याव
ꢥꢵꢮꢶ / ꢡꢵꢬ꣄
नावि / तार्
ꢬꢴꢾꢞꣁ
र्ह॑डा॑
ꢆꢦꢒꢬꢠꣁ
उपगरणा॑
ꢥꢔꢸꢥꣁ / ꢲꢭꣁ
नगुना॑ / हला॑
ꢦꢵꢡ꣄ꢬꣁ
पात्रा॑
ꢱꢹꢞꢸ ꢢꢵꢪ꣄
सूडु थाम
ꢕꢥꢪꢶꢡꢶ
गनमिति
ꢒꢫ꣄ꢭꢒꢾꢱꢸꢬꢸ ꢒꢾꢬꢶ
कय्लक॑सुरु क॑रि
ꢱꢾꢦꢶꢥꢶ / ꢦꢮ꣄ꢒꢭ꣄ / ꢦꢮ꣄ꢱꢸꢭ꣄
च्पिनि / पव्कल / पव्सुल
ꢣꢵꢬ꣄ꢮꢵꢥ꣄ / ꢬꢴꢒ꣄ꢒꣀꢡ꣄ / ꢗꢮ꣄ꢒꢷꢣꢵꢬ꣄
दार्वान / र्हक्कित / चव्कीदार
ꢦꣂꢭꢷꢱ꣄ / ꢒꢮꢭ꣄ꢒꢾꢬꣁ / ꢢꢠꣀꢡ꣄
पा॑लीस / कवल्क॑रा॑ / थणैत
ꢮꢶꢞ꣄ꢔ꣄ꢫꢵ ꢆꢰ꣄ꢳꣁ / ꢗꢸꢥ꣄ꢥꢵ ꢆꢰ꣄ꢳꣁ
विद्ग्या उष्ळा॑ / चुन्ना उष्ळा॑
ꢙꢹꢠꢡ꣄ꢮꢵꢥ꣄
जूणत्वान
ꢓꢸꢪ꣄ꢨꢵꢬ꣄
खुम्बार्
ꢒꣁꢬꢜ꣄
का॑रट
ꢦꢸꢜ꣄ꢒꢶ / ꢦꢜꢶ
पुट्कि / पटि
ꢒꢹꢭꢶ
कूलि
ꢒꢹꢭꢶꢒꢾꢬꢶ
कूलिक॑रि
ꢲꢵꢡꢸꢒꢵꢪ꣄
हातुकाम्
ꢱꢲꢵꢫꢒꣁ / ꢱꢶꢔꢸꢞꣁ
शाहायका॑ / सिकुडा॑
ꢲꢵꢡꢸ ꢏꢬꣁ
हातु आ॑रा॑
ꢲꢵꢡꢸ ꢒꢵꢪ꣄
हातु काम्
ꢒꣁꢭ꣄ꢒꢶ / ꢱꢪ꣄ꢜꢵꢮ꣄
का॑ल्कि / सम्टाव
ꢬꢮꢸꢭꢸ ꢩꢷꢡ꣄
रवुलु भीत
ꢭꢮ꣄ꢬꢶ
लव्रि
ꢓꢿꢞ꣄
खेड्
ꢦꢬꢱꢸ
पर्सु
ꢗꢾꢒ꣄ꢒꢬ꣄
च॑क्कुर्
ꢱꢾꢖ꣄ꢒꢳ꣄
स॑ङ्कळ
ꢱꢪꢹꢲ ꢱꢿꢮꣁ
समूह सेवा॑
ꢲꢥ꣄ꢣꢮ꣄ ꢒꢾꢬꣁ
हन्दव क॑रा॑
ꢲꢥ꣄ꢣꢮ꣄ ꢒꢾꢬꢶꢥ꣄
हन्दव क॑रिन
ꢗꢵꢜꣁ
चाटा॑
ꢱꢵꢠ꣄
साण
ꢱꢵꢪꢠꣁ
सामणा॑
ꢬꢾꢖ꣄ꢔꢸ
र॑ङ्गु
ꢮꢶꢞꢶ
विडि
ꢱꢶꢭ꣄ꢦꢸ
सिल्पु
ꢝꢖ꣄ꢒ꣄ꢥꢵꢬ꣄ / ꢱꢶꢭ꣄ꢦꢶ / ꢱꢶꢭ꣄ꢦꢒꢵꢬ꣄
ठङ्क्नार / सिल्पि / सिल्पकार
ꢧꢶꢬ꣄ꢮꢜ꣄
फिर्वट्
ꢗꢸꢥ꣄ꢥꣁ
चुन्ना॑
ꢱꢸꢡ꣄ꢡꢶꢫꢭ꣄ / ꢪꢹꢬ꣄
सुत्तियल् / मूर
ꢩꢵꢬ꣄ꢡꢸꢒ꣄ꢒꢸꢥꢵꢬ꣄
भार्तुक्कुनार
ꢆꢰ꣄ꢭꣁ
उष्ला॑
ꢦꢾꢠ꣄ꢕꢠꣁ
प॑ण्घणा॑
ꢗꢾꢠ꣄ꢜꢾ ꢮꢵꢡ꣄ꢫꢪ꣄
च॑ण्ट॑ (वात्यम्)
ꢪꢴꢳꢫ꣄ꢡꢸ / ꢪꢴꢳ꣄ꢶꢮꢵꢥ꣄ / ꢪꢴꢳꢶꢶꢒꢾꢬꢶ
म्हळय्तु / म्हळिवान / म्हळिकेरि
ꢱꢾꢒ꣄ꢒꢸꢭꢸꢮꢵꢥ꣄
स॑क्कुलुवान
ꢒꢵꢬ꣄ꢫꢣꢬ꣄ꢱꢶ
कार्यदर्सि
ꢒꢵꢬ꣄ꢫꢡꢬ꣄ꢱꢶ
कार्यदर्सि
ꢙꣂꢱ꣄ꢫꢪ꣄
जोस्यम्
ꢱꣂꢱꢶ
जोसि
ꢡꢾꢔꢞ꣄
त॑गड
ꢲꣁꢣꢫ꣄ꢡꢸ
हा॑डय्तु
ꢱꣁꢥꢵꢬꢸ / ꢒꢱꢵꢬ꣄
सा॑नार / कसार
ꢭꢿꢔꢸꢮꢵꢥ꣄ / ꢡꢦꢵꢭ꣄ꢒꢾꢬꣁ
लेगुवान् / तपाल्क॑रा॑
ꢡꢾꢬ꣄ꢒꢳꢶ
त॑र्कळि
ꢡꢾꢬꢒ꣄
त॑रक्
ꢤꣁꢠ꣄ꢞꣁ
धा॑ण्डा॑
ꢣꣁꢨ꣄ꢨꢥ꣄ ꢔꢸꢰ꣄ꢜꢶ
दा॑ब्बन गुष्टि
ꢪꢔꣁ
मगा॑
ꢒꢸꢱ꣄ꢒꢥ꣄ꢓꢜ꣄ꢜꢶ
कुस्कन्खट्टि
ꢣꢶꢒ꣄ꢒꢸ ꢣꢾꢒ꣄ꢒꢞꢵꢮ꣄ / ꢣꢶꢒ꣄ꢒꢸ ꢣꢬ꣄ꢱꢶꢥꢶ / ꢣꢶꢒ꣄ꢒꢸ ꢱꢹꢗꢥꢶ
दिक्कु द॑क्कडाव / दिक्कु दर्सिनि / दिक्कु सूचनि
ꢩꢶꢒꢸꢖ꣄ꢗꢸꢥꢵꢮ꣄
भिकुञ्च्नाव
ꢥꢮ꣄ꢒꢵ ꢣꢠ꣄ꢞꢸ / ꢥꢮ꣄ꢣꢠ꣄ꢞꢸ
नव्का द्ण्डु / नव्दण्डु
ꢦꣁꢱ꣄ꢥꢵꢮ꣄
पा॑स्नाव
ꢧꢸꢮ꣄ꢥꣁ / ꢧꢸꢮ꣄ꢥꢵꢮ꣄
फुव्ना॑ / फुव्नाव
ꢦꢸꢜ꣄ꢜꢵ ꢲꢷꢬ꣄
पुट्टा हीर
ꢦꢸꢜ꣄ꢜꣁ ꢡꢔꢱ꣄ꢡꢾ
पुट्टा॑ तगस्ते
ꢡꢸꢒ꣄ꢒꢥ꣄ ꢌꢥ꣄ꢡꢸꢬ
तुक्कन् एन्तुर
ꢣꢹꢒ꣄ꢒꢸꢣꣂꢬ꣄
दूक्कुदोर
ꢡꢹꢒ꣄ꢒꢸ ꢪꢶꢜ꣄ꢜꣁ
तूक्कु मिट्टा॑
ꢪꢴꢳꢶ ꢤꢾꢬ꣄ꢥꢵꢮ꣄
म्हळि ध॑र्नाव
ꢦꢸꢬꢸꢱ꣄ / ꢒꢸꢗ꣄ꢗꢥ꣄
पुरुस् / कुच्चन्
ꢪꣀꢪꢲꢶ ꢲꣁꢮ꣄ꢞꢶꢠꢶ
मैमहि हा॑व्डिणि
ꢱꢷꢮ꣄
सीव
ꢱꢶꢪ꣄ꢦꢶ
सिम्प
ꢱꢸꢪ꣄ꢦꢶꢥꢶ
सिम्पिनि
ꢱꢶꢮ꣄ꢥꢶ ꢫꢥ꣄ꢡꢸꢬ꣄
सिव्नि यन्तुर
ꢆꢣ꣄ꢫꣂꢔ꣄ / ꢆꢣ꣄ꢫꣂꢔꢶ
उद्योग / उद्योगि
ꢭꢵꢥꢸꢮꢵꢥ꣄
लानुवान्
ꢭꢵꢥ꣄
लान
ꢏꢞ꣄ꢞꢾ / ꢱꢸꢣ꣄ꢤꢶ ꢒꢾꢬ꣄ꢥꢵꢬ꣄
आ॑ड्ड॑ / सुद्धि क॑र्नार
ꢣꣂꢠꢶ
दोणि
ꢒꢾꢰꢥ꣄
क॑षण्
ꢱꣁꢥ꣄ꢥꢵꢮꢠꢶꢒ꣄
सा॑न्नावणिक
ꢱ꣄ꢢ꣄ꢬꢶꢒꢾꢬꢥ꣄ ꢆꢦꢒꢬꢠꣁ
स्थरिकेरन उपकरणा॑
ꢗꢭ꣄ꢡꢒꢬꢥ꣄ꢮꢵꢥ꣄
चल्तकरन्वान्
ꢕꢭ꣄ꢥꢶ
घल्नि
ꢥꢵꢗ꣄ꢮꢵꢥ꣄
नाच्वान्
ꢥꢜꢥꢵꢳꢶ
नटनाळि
ꢥꢗ꣄ꢮꣁ / ꢥꢜꢶ
नच्वा॑ / नटि
ꢥꢗ꣄ꢮꢶ / ꢥꢜꢶꢒꣁ
न्च्वि / नटिका॑
ꢩꢵꢮꢥꣁ
भावना॑
ꢥꢬ꣄ꢡ꣄ꢡꢒꣁ
नर्त्तका॑
ꢥꢬ꣄ꢡ꣄ꢡꢒꢶ
नर्त्तकि
ꢥꢮꢗꢵꢬ꣄
नवचार
ꢥꢜ꣄ꢒꢪ꣄ꢒꢾꢬꢶ
न्ट्कम्केरि
ꢥꢜ꣄ꢒꢪ꣄ ꢂꢳꢶ
नट्कमु अळि
ꢥꢮ꣄ꢒꣁ
नका॑
ꢱꢱ꣄ꢫꢬꣁꢲꢥ ꢬꢾꢪ꣄
सस्यरोहन रेम
ꢥꢶꢬ꣄ꢮꢵꢲꢶ
निर्वाहि
ꢓꣁꢳ꣄꣄ꢗꢾ
खा॑ळ्च॑
ꢦꢵꢱꢥꣁ / ꢦꢥꢶ ꢱꢶꢛ꣄ꢗꢥꣁ
पासना॑ / पनि सिञ्चना॑
ꢆꢱ꣄ꢦꢸꢮꢵꢮ꣄
उस्पुवाव
ꢫꣁꢒ꣄ ꢩꢥ꣄ꢣꢥꣁ / ꢥꢔꣁ
योक भन्दना॑ / नगा॑
ꢡꢵꢒ꣄ / ꢣꣁꢬꢶ
ताक् / दा॑रि
ꢒꢣꢸꢥꢵꢬ꣄
क्दुनार
ꢒꢣꢱ꣄ꢡꢾ
कदस्ते
ꢮꢶꢥ꣄ꢒꢬ꣄
विन्कर
ꢮꢶꢥꢱ꣄ꢡꢾ
विनते
ꢆꢒ꣄ꢒꢶꢱꣁꢠ꣄ꢠꢶ / ꢆꢡ꣄ꢡꣂꢭꢒꣁ
तुक्किसा॑ण्णि / उत्तोलका॑
ꢦꣁꢜ꣄ꢜꢾꢜ꣄ / ꢒꢵꢪꢸ ꢱ꣄ꢢꢭ꣄ / ꢒꢵꢪꢸ ꢢꢵꢪ꣄
पा॑ट्ट॑ट / कामु स्थल / कामु थाम
ꢦꢛBꢗꢭ꣄
पञ्चल्
ꢙꢷꢮꢵꢯ꣄ꢪꣁ / ꢱꢶꢭꢵꢤꢵꢡꢸ
जीवाश्मा॑ / सिलाधात
ꢦꢡ꣄ꢬꢸ
पत्रु
ꢱꢵꢭꣁ
साला॑
ꢒꢵꢪ꣄
काम्
ꢒꢵꢪ꣄ꢢꢵꢪ꣄
काम्थाम्
ꢱꢪ꣄ꢦꢵꢡꢒꣁ
स्म्पातका॑
ꢥꣃꢒꣁ
नौका॑
ꢥꢸꢡꢸ
रुतु
ꢣꢵꢡ꣄ ꢗꢾꢒ꣄ꢒꢸꢬ꣄
दातु च॑क्कुर्
ꢦꣁꢭ꣄ꢒꣁ / ꢦꢭ꣄ꢒꣁ
पोल्का॑ / पल्का॑
ꢩꢵꢬ꣄ ꢡꢸꢒ꣄ꢒꢸꢥꢵꢮ꣄
भार्तुक्कुनाव
ꢂꢲꢶꢡꢸꢠ꣄ꢞꢶꢒꣁ / ꢱꢵꢦꢸꢮꢱꢒꣁ
अहितुण्डिका॑ / सापुवसका॑
ꢥꢮ꣄ ꢪꢵꢬ꣄ꢔ ꢗꢵꢭꢥ / ꢥꢮ꣄ ꢥꢶꢫꢥ꣄ꢡ꣄ꢬꢠ ꢦꢜꣁ
नव मार्ग चालन / नव्नियन्त्रण पटा॑
ꢣꢵꢬ꣄
दार
ꢥꣃꢒꣁ
नौका॑
ꢦꢖ꣄ꢗꢭ꣄ / ꢮꢡ꣄ꢡꢾ
पञ्चल् / वत्त॑
ꢔꣁꢠꢪ꣄
गा॑णम्
ꢦꢭꣁ
पला॑
ꢌꢪꢸ ꢮꢱ꣄ꢡꢬ꣄ / ꢌꢪꢸ ꢨꢥ꣄ꢤꢶꢒꣁ
हेमु वस्तर / हेमु बन्धिका॑
ꢭꢖBꢔꣂꢜ꣄ / ꢒꢰ꣄ꢜꢶ ꢨꣁꢜ꣄ꢜꣁ
लङ्गोट् / कष्टि बा॑ट्टा॑
ꢲꢿꢪꢸꢮꢱ꣄ꢡꢬ꣄
हेमुवस्तर्
ꢓꢥꢵꢮ꣄ / ꢔꢾꢜ꣄ꢨꢵꢬꣁ
कनाव / ग॑ट्बारा॑
ꢣꢹꢡ꣄ꢒꢾꢬꣁ
दूतक॑रा॑
ꢣꢹꢡ꣄ꢒꢾꢬꢶꢥ꣄
दूत्क॑रिन्
ꢡꢥꢶ
तनि
ꢔꢸꢪ꣄ꢦꢶꢥꢶ / ꢮꢾꢥꢶ
गुम्प्नि / व॑नि
ꢪꢶꢜ꣄ꢜꣁ / ꢧꢷꢝꢪ꣄
मिट्टा॑ / फीठम्
ꢦꢶꢦꢵꢫ꣄
पिपाय
ꢧꢹꢭ꣄ꢒꢾꢬꢶꢥ꣄
फुल्क॑रिन
ꢲꢨ꣄ꢨꢸ ꢥꢵꢱꢶꢥꢶ / ꢒ꣄ꢬꢸꢪꢶ ꢥꢵꢱꢶꢥꢶ
हब्बु नास्नि / क्रुमि नासिनि
ꢦꢸꢜ꣄ꢜꢭꢸ ꢒꢸꢞꣁ
पुट्टलु कुडा॑
ꢒꢱꢵꢬ꣄ / ꢱꣁꢥꢵꢬ꣄
कसार / सा॑नार
ꢱꢪꢱꢥꢶ
समसनि
ꢥꢴꢶꢥꢵꢮ꣄ ꢒꢾꢬꢵꢮ꣄
न्हिनाव क॑राव
ꢪꢥ꣄ꢡꢶꢮꢵꢡꢶ
मन्तिरवाति
ꢮꣁꢫ꣄ꢣꢶꢥ꣄
वा॑य्दिन्
ꢮꣁꢫ꣄ꢣꢸ
वा॑य्दु
ꢲꣁꢔꢡ꣄
हा॑गत्
ꢦꢬꢱꢸ
परसु
ꢨꢮ꣄ꢭꢪ꣄
बव्लम्
ꢂꢣ꣄ꢣꢶ ꢩꢵꢬ꣄
अद्दिभार्
ꢂꢣ꣄ꢣꢶ ꢨꢶꢱ꣄ꢱꣁ / ꢦꢾꢭꢶ ꢨꢶꢱ꣄ꢱꣁ
अद्दिबिस्सा॑ / भ॑ळिबिस्सा॑
ꢡꢾꢭ꣄ꢥꢶ
त॑ल्नि
ꢮꢶꢣ꣄ꢫꢸꢡ꣄ ꢔꣀꢞꢶ
विद्युत गैडि
ꢪꢴꢭꢶꢒꢾꢬꣁ / ꢪꢴꢭꢶꢮꢵꢥ꣄
म्हळीक॑रा॑ / म्हलिवान
ꢪꢴꢭꢶꢒꢾꢬꢶꢥ꣄ / ꢪꢴꢭꢶꢮꢡꢶ
म्हळिक॑रिन / म्हळिवति
ꢗꢶꢔꢸꢬ꣄ / ꢂꢖ꣄ꢒꢸꢬ꣄ / ꢂꢖ꣄ꢔꢸꢬꣁ
चिकुर / अङ्कुर / अङ्कुरा॑
ꢨꢶꢔꢶꢖ꣄ꢗꢸꢥꢵꢮ꣄
बिगिञ्चुनाव
ꢥꢶꢬ꣄ꢮꢵꢲꢶ / ꢒꢵꢪ꣄ ꢓꢜ꣄ꢥꢵꢬ꣄
निर्वाहि / काम खट्नार
ꢤꣁꢠ꣄ꢞꣁ ꢒꢾꢬꢶ
धा॑ण्डा॑क॑रि
ꢡꢥꢵ ꢬꢾꢞꣁ / ꢬꢾꢞꣁ / ꢗꢬ꣄ꢒꢵ ꢬꢾꢞꣁ
तना र॑डा॑ / र॑डा॑ चर्का र॑डा॑
ꢦꣁꢬꢜꢶꢥ꣄ / ꢦꣁꢭ꣄ꢜꢶꢥ꣄
पा॑रटिन / पा॑ल्टिन
ꢒꣁꢬꢜ꣄
का॑रट
ꢧꢶꢬꢸꢞꢵꢮ꣄
फिरुडाव
ꢪꢹꢬ꣄ / ꢪꢸꢬꣁ / ꢱꢸꢡ꣄ꢡꢶꢫꢭ꣄
मूर / मुरा॑ / सुत्तियल
ꢓꢿꢥꢸ / ꢓꣂꢥꢸ
खेनु / खोनु
ꢦꣁꢬꢜ꣄ / ꢦꣁꢳ꣄꣄ꢜꣁ
पा॑रट / पा॑ळ्टा॑
ꢨꢶꢫꢵꢬ꣄ / ꢨꢶꢫꢵꢬ꣄ꢗꢵꢬ꣄
भियार / भियार्सार
ꢮꢠꢷ / ꢮꢠꢶꢒ꣄
वणि / वणिक
ꢦꢾꢫ꣄ꢬ꣄ / ꢒꢾꢡ꣄
पेय्र् / केत्
ꢙꢵꢭ꣄ / ꢏꢭꣁ
जाल् / आ॑ला॑
ꢮꢵꢜ꣄ꢣꢾꢓ꣄ꢒꢜ꣄ꢥꢵꢬ꣄ / ꢪꢵꢬ꣄ꢔꢣꢬ꣄ꢱꢒ꣄
वाट द॑खट्नार / मार्गदर्सक
ꢥꣃꢒꣁ
नैका॑
ꢗꢾꢒ꣄ꢒꢸꢬ꣄
च॑क्कुर
ꢘꢾꢡ꣄
छेत
ꢨꢷ / ꢨꢷꢒ꣄ / ꢨꢷꢙ꣄
बी / बीक / बीज
ꢅꢪꢸ / ꢨꢷꢙ꣄ / ꢨꢷꢡ꣄ꢡꢸ
ईमु / बीज् / वित्तु
ꢨꢷꢒ꣄ꢕꢭ꣄ꢥꢶ
बीक्घल्नि
ꢩꢶꢫꢵꢬ꣄/ ꢩꢶꢫꢵꢬ꣄ꢱꢵꢬ꣄
भियार/भियार्सार्
ꢮꢠꢶ / ꢮꢠꢶꢒ꣄
वणि / वणिक
ꢒ꣄ꢬꢸꢰꢶ
क्रुषि
ꢙꢸꢥ꣄ꢥꢡ꣄ꢮꢵꢥ꣄ / ꢥꢖ꣄ꢔꢸꢥꢬ꣄
जुन्नत्वान / नङ्गुनर
ꢦꢷꢒ꣄ / ꢦꢶꢒ꣄ꢒꢶꢥꢶ / ꢦꢶꢒ꣄ꢒꢾꢫꣁ
पीक / पिक्किनि / पिक्क॑या॑
ꢦ꣄ꢬꢒꢜ꣄ꢥꢵꢬ꣄ / ꢦ꣄ꢬꢱꢸꢬꣁ ꢒꢾꢬ꣄ꢥꢵꢬ꣄ / ꢩꢬꢵꢜ꣄ ꢱꣁꢞ꣄ꢠꢵꢬ꣄
प्रकट्नार / प्रसुरा॑ क॑र्नार / भराट सा॑ड्णार
ꢃꢓꢾꢜ꣄ / ꢪꢺꢔꢫꣁ / ꢮꢿꢜꣁ ꢓꢳ꣄ꢥꢶ
आखेट / मृगया॑ / वेटा॑ खळ्नि
ꢃꢓꢾꢜꢸꢮꢵꢥ꣄ / ꢮꢿꢜꣁ ꢓꢳ꣄꣄ꢥꢵꢬ꣄
आखेटुवान / वेटा॑ खळ्नार
ꢒꢵꢪ꣄
काम्
ꢒꢵꢪ꣄ ꢒꢾꢬ꣄ꢡ꣄ꢡꣁ
काम क॑र्ता॑
ꢒꢵꢪ꣄ ꢒꢾꢬ꣄ꢡ꣄ꢡꢶꢥ꣄
काम क॑र्तिन
ꢮꣁꢫ꣄ꢡꢸ
वा॑य्तु
ꢙꣂꢱꢸꢜꢸ
जोसुटु
ꢱꢶꢱ꣄ꢭꢵꢥ꣄ / ꢓꢥꢶ ꢩꣁꢠ꣄ꢠꢪꢸꢥ꣄ / ꢓꢵꢣ꣄ꢫ ꢱꢵꢪꢔ꣄ꢬꢶꢥ꣄
सिअलान / खनि भा॑ण्णमुन / खाद्य साम्ग्रिन
ꢂꢣꢶꢪꢤꢸꢬꢪ꣄
अदिमधुरम
ꢡꢥ꣄ꢣꢸ
तन्दु
ꢍꢬꢠ꣄ꢞꣁ
एरण्डा॑
ꢂꢭ꣄ꢭꣁ
अल्ला॑
ꢭꣁꢪ꣄ꢧꢹꢭ꣄
ला॑म्पूल
ꢪꢷꢜ꣄
मीट्
ꢆꢖ꣄ꢒꣁ / ꢣꢸꢱꣁ
उङ्का॑ / दुसा॑
ꢤꢹꢳ꣄꣄ꢪꢹꢳ꣄꣄
धुळ्मूळ
ꢒꢥ꣄ꢣꣁ
कन्दा॑
ꢆꢞꢶꢡ꣄
उडित्
ꢡꢿꢭ꣄
तेल्
ꢡꢷꢳ꣄꣄
तीळ
ꢌꢭꣁ
एला॑
ꢏꢪꣁ
आ॑मा॑
ꢔꢱꢔꢱꢵꢭ꣄
गसगसाल
ꢗꢾꢥ꣄ꢥꣁ
च॑न्ना॑
ꢪꢴꢸꢬꢶ
म्हुरि
ꢭꢮꢖ꣄ꢔ ꢦꢜ꣄ꢜꣀ
लवङ्गपट्टै
ꢓꢾꢠ꣄ꢞꢸ / ꢄꢒ꣄ꢱꢸꢔꢾꢞ꣄ꢞꣁ
ख॑ण्डि / इक्षुग॑ड्डा॑
ꢒꢸꢳꢶꢡ꣄
कुळित
ꢒꢵꢦꢶꢩꢸꢬ꣄ꢒꣁ
कापिभुर्का॑
ꢲꢶꢖ꣄ꢔꢸ
हिङ्गु
ꢬꣁꢪ꣄ꢧꢸꢭ꣄
रोम्फुल्
ꢒꢶꢱ꣄ꢪꢶꢱ꣄
किस्मिस्
ꢒꢸꢖ꣄ꢒꢸꢪ꣄ꢧꢸꢭ꣄ / ꢒꢾꢱꢬꢶ
कुङ्कुम्फूल् / केसरि
ꢃꢬꢮꢭ꣄ꢭꢶ ꢩꢸꢬ꣄ꢒꣁ
आरवल्लि भुका॑
ꢬꢴꢔꢶ
र्हगि
ꢒꢿꢱꢬꢶꢩꢸꢬ꣄ꢒꣁ
केसर्भुका॑
ꢒꢗ꣄ꢗꢾꢥ꣄ꢥꣁ
कच्च॑न्ना॑
ꢤꢥꢶꢫꢵ / ꢒꣁꢡ꣄ꢡꢪꢭ꣄ꢭꢶ
धनिया / का॑त्तमल्लि
ꢱꢸꢒ꣄ꢒꢾ ꢥꢬꢾꢭ꣄
सुक्क॑ नर॑ल
ꢕꣁꢪꢸ / ꢕꣂꢪ ꢡꢥ꣄ꢣꢸ
घोमु / घोम तन्दु
ꢱꢾꢒ꣄ꢒꢬ꣄
सेक्कर्
ꢥꢶꢳꢪ꣄
निळम्
ꢱꢶꢔꢵꢫ꣄ꢩꢸꢬ꣄ꢒꣁ
सिगाय्भुका॑
ꢙꢶꢬꣁ
जिरा॑
ꢗꢾꢒ꣄ꢒꢬ꣄ ꢒꢾꢳꢖ꣄ꢒꢸ
स॑क्कर क॑ळङ्कु
ꢱꣁꢠ꣄ꢜꢶ
सा॑ण्टि
ꢫꣂꢞ ꢪꢷꢜ꣄
सा॑डा मीट्
ꢚꣁꢳ꣄ꢳꣁ
झा॑ळ्ळा॑
ꢒꣁꢠ꣄ꢞꣁ
का॑ण्डा॑
ꢤꣂꢬꢸꢨꢾꢳꣁ
थोरु ब॑ळा॑
ꢤꣂꢬ꣄
थोर्
ꢥꢬꢸꢳꢸ ꢡꢾꢭ꣄
नरळु तेल
ꢜꢷ
टी
ꢗꣁꢒꢜ꣄ꢡꢾꢭ꣄
चा॑कट्तेल
ꢩꣁꢄꢄ ꢗꢾꢥ꣄ꢥꣁ / ꢒꢞꢭꢾ
भोइ~ च॑न्ना॑ / कडल॑
ꢱꢵꢭ꣄
साल्
ꢦꢜ꣄ꢜꢵꢠꢶ
पट्टाणि
ꢨꢾꢳꣁ
ब॑ळा॑
ꢱꢶꢱ꣄ꢭꣁ
सिस्ला॑
ꢂꢦ꣄ꢦꢳ꣄
अप्पळ
ꢥꢶꢭꢪꢸ꣄ ꢨꢾꢳꣁ
निलमु ब॑ळा॑
ꢨꢵꢣꢵꢪ꣄
बादाम्
ꢨꢵꢬ꣄ꢭꢶ
बार्लि
ꢤꢸꢪ꣄ꢦꢵꢥ꣄
धुम्पान्
ꢲꢸꢞ ꢡꢥ꣄ꢣꢸ
हुड तन्दु
ꢗꢷꢱ꣄
चीस्
ꢭꣁꢱꢥ꣄
ला॑सन
ꢪꢴꣁꢞ ꢙꢶꢬꣁ
म्हा॑ड जिरा॑
ꢲꢳꢡ꣄
हळत्
ꢣꢶꢔꢬꢪ꣄
दिगरम्
ꢪꢹꢭ꣄ꢡꢸꢭ꣄ꢭꣁ ꢃꢭ꣄ꢮꢭ꣄ꢭꢶ ꢒꢶꢳꢖ꣄ꢔꢸ
मूल्पुल्ला॑ आल्वल्लि किळङ्गु
ꢃꢭ꣄ ꢮꢭ꣄ꢭꢶ ꢒꢶꢳꢖ꣄ꢔꢸ
आल्वल्लि किळङ्गु
ꢦꢷꢜ꣄
पीट्
ꢪꢶꢬꢶ
मिरि
ꢒꢵꢙꢸ
काजु
ꢒꢾꢥ꣄ꢥꢸ
क॑न्नु
ꢬꢮꢾ / ꢱꣁꢙ꣄ꢙꢶ
रव॑ / सा॑ज्जि
ꢦꢹꢱꢸ ꢪꢶꢬꢶ
पूसुमिरि
ꢗꢫ꣄ꢭꢶ
चय्लि
ꢪꢶꢡ꣄ꢡꢶ
मित्ति
ꢔꢸꢳ꣄ꢳꢸ / ꢔꢸꢞ꣄ꢳꢸ
गुळ्ळु / गुड्ळु
ꢭꣁꢱꢥ꣄
ला॑सन्
ꢒꢞꢭꢾ
कडल॑
ꢙꢵꢡꢶ ꢒꢫ꣄ꢭꣁ
जाति कय्ला॑
ꢤꢸꢪ꣄ꢨꢸꢬꢵꢱ꣄ꢜꢸ
धुम्बुरास्टु
ꢓꢙꢸꢬ꣄ / ꢓꢱ꣄ꢭꣁ
खजुर / खस्ला॑
ꢒꢱ꣄ꢡꢥ꣄ꢡꢸ
कस्तन्त्तु


Script - Religious Pilgrimage


ꢤꢵꢬ꣄ꢪꢷꢒ ꢱ꣄ꢢꢵꢦꢥꢵꢥ꣄
धार्मीक स्थापनान
ꢂꢯꢬꢷꢬꢶ
अशरीरि
ꢣꢵꢱꢸꢥ꣄
दासुन
ꢂꢩꢶꢰꢿꢒ꣄
अभिषेक्
ꢂꢬ꣄ꢗꢥꣁ
अर्चना॑
ꢒꢺꢦꣁ
कृपा॑
ꢂꢮ꣄ꢡꢵꢬ꣄
अव्तार्
ꢃꢱꢶꢰ꣄ / ꢃꢱꢷꢬ꣄ꢮꢵꢡ꣄
आसिष् / आसीर्वात्
ꢃꢱ꣄ꢬꢪꣁ
आस्रमा॑
ꢣꢿꢮ꣄ / ꢩꢔꢮꢵꢥ꣄
देव् / भगवान्
ꢃꢬꢵꢤꢥꣁ
आराधना॑
ꢣꢮ꣄ꢬꣁ / ꢪꢥ꣄ꢣꢶꢬ꣄
दब्रा॑ / मन्दिर
ꢃꢡ꣄ꢪꣁ
आत्मा॑
ꢩꢒ꣄ꢡꢶ ꢪꢵꢬ꣄ꢔꢸ
भक्ति मार्गु
ꢃꢱ꣄ꢡꢶꢒ꣄
आस्तिक
ꢡꢸꢞꢶꢫꢵꢥꢸ ꢪꢵꢬ꣄ꢔꢸ
तुडियानु मार्गु
ꢲꢶꢥ꣄ꢣꢸ
हिन्दु
ꢣꢿꢮꢸ ꢩꢒ꣄ꢡꢶ
देवु भक्ति
ꢣꢾꢮ꣄
देव्
ꢅꢯꣁ / ꢅꢯ꣄ꢦꢸꢬꢸ
ईशा॑ / ईश्पुरु
ꢲꢸꢠ꣄ꢞꢶ
हुण्डि
ꢱꣂꢩꢵ ꢫꢵꢡ꣄ꢬꣁ
सोभा यात्रा॑
ꢬꢒ꣄ꢰꢸꢥꢵꢬ꣄
रक्षुनार
ꢔꢬ꣄ꢩ ꢔ꣄ꢒꢺꢲꢪ꣄
गर्भ गृहम्
ꢱꢪꢵꢤꢶ
समाधि
ꢒꢬ꣄ꢦꢸꢬ꣄ / ꢂꢡ꣄ꢡꢶꢪ꣄ꢨꢸꢬ꣄
कर्पूर / अत्तिम्बुर
ꢒꢾꢥ꣄ꢫꢵꢱ꣄ꢡꢶꢬꢷ
क॑न्या स्तिरी
ꢒꢵꢠꢶꢒ꣄ꢒꢿ
काणिक्क॑
ꢒꢵꢮꢶꢮꢱ꣄ꢡꢬ꣄
काविवस्तर्
ꢒꢶꢬꢸꢱ꣄ꢡꢸ ꢪꢵꢬ꣄ꢔꢸ
किरुस्तु मार्गु
ꢒꢷꢬ꣄ꢡ꣄ꢡꢥꢵꢥ꣄
कीर्त्तनान्
ꢒꢸꢭꢣꢿꢮ꣄
कुलदेव्
ꢣꢸꢮꣁ
दुवा॑
ꢔꢸꢬꢸ
गुरु
ꢤ꣄ꢮꢙ ꢱ꣄ꢢꢪ꣄ꢨꢸ
ध्वज स्थम्बु
ꢣꢵꢥ꣄
दान
ꢤꢮ꣄ꢬꣁ / ꢪꢥ꣄ꢣꢶꢬ꣄
धव्रा॑ / मन्दिर
ꢯꢒ꣄ꢡꢶ
शक्ति
ꢱꢶꢬ꣄ꢒꢥ꣄ / ꢯ꣄꣄ꢬꢶꢔꢥ꣄ꢤꢸ
सिर्कन / श्रिगन्धु
ꢱꢥ꣄ꢫꢵꢱ꣄
सन्यास्
ꢱꢥ꣄ꢫꢵꢱꢶ
सन्यासि
ꢱꢥ꣄ꢫꢵꢱꢶꢥꢶ
सन्यासिनि
ꢱꢪꢠ ꢪꢵꢬ꣄ꢔꢸ
समण मार्गु
ꢮꢵꢜ꣄ / ꢤꢾꢬꢸꢪ꣄ / ꢤꢬ꣄ꢪꢸ
वाट् / धेरुम / धर्मु
ꢱꢵꢣꢸ
सादु
ꢣꢿꢮ꣄
देव्
ꢱꢵꢨꢥꣁ / ꢂꢩꢶꢱꢵꢦ꣄
साबना॑ / अभिसाप्
ꢱꢶꢡ꣄ꢡꢬ꣄
सित्तर्
ꢱꢶꢭꢸꢮꣁ
सिलुवा॑
ꢱꢶꢭꣁ / ꢱꢶꢭ꣄ꢨꣁ
सिला॑ / सिल्पा॑
ꢯꢶꢶꢮꣁ / ꢅꢯ꣄ꢦꢸꢬꢸ
शिवा॑ / ईश्पुरु
ꢥꢴꢥ꣄ ꢣꢿꢮ꣄ / ꢔꢵꢪꢸ ꢣꢿꢮ꣄
न्हनदेव् / गमुदेव्
ꢱꢶꢰ꣄ꢫꢵꢥ꣄
सिष्यान
ꢪꣁꢱ꣄ꢫꢵꢥ꣄ / ꢬꢸꢣ꣄ꢬꢦꢹꢪꢶ
मा॑स्यान / रुग्रपूमि
ꢱꢸꢮꢡ꣄ꢡꢵꢥ꣄ / ꢱꢸꢱꢥ꣄ꢣꢾꢱꢸꢥ꣄
सुवत्तान / सुसन्देसुन
ꢱꣀꢮꢪ꣄
सैवम्
ꢱ꣄ꢮꢬ꣄ꢔꢸ
सवर्गु
ꢛꢵꢥ ꢱ꣄ꢥꢵꢥ꣄
ञान स्नान्
ꢡꢦꢱ꣄
तपस्
ꢦꣁꢳ꣄ꢳꢶ ꢮꢵꢱꢭ꣄
पोळ्ळिवासल
ꢤꢬ꣄ꢪꢒꢬ꣄ꢡꣁ / ꢥ꣄ꢫꢵꢱꢶ
धर्मकर्ता॑ / न्यासि
ꢤ꣄ꢫꢵꢥ꣄
ध्यान्
ꢣꢮ꣄ꢬꣁ
दव्रा॑
ꢱꢸꢦ꣄ꢬꢩꢵꢡꢸꢪ꣄ ꢣꢾꢮꢸꢒ꣄ ꢲꢸꢞꢞ꣄ꢥꢶ
सुप्रभातुम देवुक हुडड्नि
ꢯ꣄꣄ꢬꢷ ꢦꢵꢣꢪ꣄
श्रि पादम्
ꢱꢪꢵꢬꢵꢤꢥꣁ / ꢣꢱꢭ꣄
समाराधना॑ / दसल
ꢤꢮ꣄ꢬꢵ ꢆꢡ꣄ꢱꢮꢸ
धव्रा उत्सवु
ꢣꢷꢦꢵꢬꢵꢡꢥꣁ
दीपारातनो
ꢣꢷꢬ꣄ꢔꢣꢬ꣄ꢱꢶ
दीर्गदर्सि
ꢡꢷꢬ꣄ꢢꢸ
दीर्थु
ꢦ꣄ꢬꢱꢵꢣ꣄
प्रसाद
ꢅꢯꣁ / ꢙꢷꢮ꣄ / ꢨꢥ꣄ꢤꢪ꣄
ईशो जीव बन्धम
ꢦꢬꢪꢵꢡ꣄ꢪꣁ / ꢪꢾꢞꢵꢡ꣄ꢪꣁ
परमात्मा॑ / मेडात्मा॑
ꢦꢸꢠ꣄ꢫꢵꢡ꣄ꢪꣁ
पुण्यात्मा॑
ꢣꢠ꣄ꢞꢶ
दण्डि
ꢨꣁꢭꢶ
बा॑लि
ꢨꣁꢭꢶꢦꢷꢟ꣄
बा॑लिबीठ
ꢦꣁꢳ꣄ꢳꢶ
पोळ्ळि
ꢦꢵꢦ꣄
पाप्
ꢦꢵꢦꢶ
पापि
ꢦ꣄ꢬꢒꢵꢬ꣄
प्रकार
ꢦ꣄ꢬꢗꢵꢬꢒ꣄
प्रचारक
ꢦ꣄ꢬꢵꢡ꣄ꢡꢥꣁ
प्रात्तना॑
ꢆꢙ꣄ꢮꢵꢮ꣄
उज्वाव
ꢃꢱꢥꣁ
आसना॑
ꢦꢸꢠ꣄ꢠꢸ
पुण्णु
ꢦꢸꢙꢬꢶ
पुजरि
ꢦꢸꢙꣁ
पुजा॑
ꢨꢶꢱꢨ꣄
बिसब्
ꢪꢲꢵꢬꢱꢥꣁ
महारसना॑
ꢱꢶꢒ꣄ꢒꢞ꣄ꢠꢵꢬ꣄
सिक्कड्णार
ꢨꢸꢣ꣄ꢤ ꢪꢵꢬ꣄ꢔꢸ
बुद्ध मार्गु
ꢪꢲꢵꢥ꣄
महान्
ꢪꢝ / ꢪꢴꣁꢞꢪ꣄
मठ / म्हा॑डम
ꢕꢾꢠ꣄ꢜꣁ
घ॑ण्टा॑
ꢪꣁꢥ꣄ꢡꢸꢬ꣄ / ꢣꢷ ꢒ꣄ꢰꣁ ꢓꢳ꣄ꢳꢥ꣄ ꢮꢾꢳ꣄꣄ ꢔꢸꢬꢸ ꢱꢖ꣄ꢔꢱ꣄ꢡꢾ ꢪꣁꢥ꣄ꢡꢸꢬ꣄
मा॑न्तुर / दीक्षो खळ्ळन वेळ गुरु सङ्गस्त॑ मा॑न्तु
ꢮꢿꢣ꣄
वेद्
ꢪꢥꢱꢵꢒ꣄ꢰꢶ
मनसाक्षि
ꢣ꣄ꢬꢵꢮꢶꢞ ꢔ꣄ꢬꢵꢪ꣄ꢫ ꢣꢾꢮ꣄ꢡꣁ
द्राविड ग्राम्य देव्ता॑
ꢪꢾꢬꢶ ꢕꢾꢬ꣄
मेरि घेर
ꢪꢵꢫꣁ
माया॑
ꢪꢵꢬꢶꢫꢪ꣄ꢪꣁ
मारियम्मा॑
ꢱꢵꢪꢶꢫꢵꢬꢸꢥ꣄
सामियारुन्
ꢪꣂꢒ꣄ꢯꢶ / ꢪꢸꢒ꣄ꢡꢶ
मोक्षि / मुक्ति
ꢬꢾꢡ꣄ꢡꢸ
र॑त्तु
ꢥꢪꢱ꣄ꢒꢵꢬ꣄
नमस्कार्
ꢥꢪꢥꣁ / ꢥꣂꢪ꣄
नमना॑ / नोम
ꢮꢶꢔ꣄ꢬꢲꢪ꣄
विग्रहम्
ꢦꢵꢦꢮꢶꢪꣂꢗꢥꣁ
पापविमोचना॑
ꢮꣁꢔꢡ꣄
वा॑गत्
ꢮꢿꢣ꣄
वेद
ꢮꣀꢰ꣄ꢠꢮꢪ꣄
वैष्णवम
ꢮꣀꢩꢮ꣄
वैभव्
ꢙꢾꢦꢪ꣄
ज॑पम्
ꢙꢾꢦꢪ꣄
ज॑पम्
ꢙꢾꢭꢸꢪ꣄
ज॑लुम्
ꢲꢵꢙꢶ / ꢲꢙ꣄ꢙꢸ ꢫꢵꢡ꣄ꢬꣁ ꢒꢾꢬꢾꢱ꣄ꢡꢾꢥꣁ
हाजि / हज्जु यात्रा॑ क॑र॑स्त॑ना॑


Script - Size and Shape


ꢦꢬꢶꢪꢵꢠꢸꢥ꣄ ꢒꢶꢥꢸ ꢬꢹꢦꢸꢥ꣄
परिमाणुन किनु रूपुन
ꢮꢶꢭꢵꢱ꣄ / ꢬꢸꢥ꣄ꢣꢶ
विलास् / रुन्दि
ꢃꢒꢵꢬ꣄
आकार्
ꢲꢡ꣄ꢡꢸ ꢮꢬ꣄ꢡꢸꢭꣁ
हत्तुवर्दुला॑
ꢱꢪꢵꢥ꣄ꢡꢬꢸ ꢬꢾꢓꢵꢥ꣄
समान्तरु रेखान
ꢆꢖ꣄ꢗꣁ
उञ्चा॑
ꢔꣁꢳ꣄
गोळ
ꢤꢸꢬꢸꢳ꣄
धुरुळ
ꢩꢵꢬ꣄
भार्
ꢩꣁꢬꢠ
भा॑रण
ꢕꢥꢵꢒꢵꢬ꣄
घनाकार
ꢦꢵꢄ~ ꢦꢬꢶꢤꢶ
पाइ~ परिधि
ꢒꢸꢳ꣄ꢳꣁ
कुळ्ळा॑
ꢒꢬ꣄ꢠꣁ / ꢮ꣄ꢫꢵꢱ꣄
कर्णा॑ / व्यास
ꢯꢖ꣄ꢒꢸ
शङ्कु
ꢒꣂꢠ꣄
कोण
ꢔꣂꢭ꣄
गोल
ꢗꢡꢸꢬ꣄
चतुर
ꢗꢪꢗꢡꢸꢬ꣄
चमचतुर
ꢡꢶꢬ꣄ꢫꢒ꣄ ꢃꢒꢵꢬ꣄
तिर्यक आकार
ꢃꢫꢡ ꢃꢒꢵꢬ꣄
आयत आकार
ꢪꢹꢬꣁ / ꢭꢾꢪ꣄ꢨꣁ / ꢭꢵꢪ꣄
मूरा॑ / लम्बा॑ / लाम
ꢒꢺꢬꢸꢔ ꢗꢵꢫꢡ꣄
कृग चायत
ꢦꢶꢬꢶꢪꢵꢠ꣄
पिरिमाण्
ꢣꢾꢳ꣄
देळ
ꢢꢷꢥ꣄ꢒꣂꢥꢸꢭ꣄ ꢡ꣄ꢬꢶꢒꣂꢠ꣄
थीन्कोनुल् त्रिकोण
ꢂꢠ꣄ꢜꢵꢒꢵꢬ꣄
अण्टाकार्
ꢃꢒꢵꢬ꣄
आकार्




Script - Sky


ꢂꢒꢵꢱ꣄ ꢒꢶꢥꢸ ꢂꢒꢵꢱꢸ ꢱꢪ꣄ꢨꢥ꣄ꢤꢸ ꢮꢡ꣄ꢡꢵꢥ꣄
अकास किनु अकासु सम्बन्धु वत्तान
ꢂꢱ꣄ꢡꢪꢥꣁ
अस्तमना॑
ꢂꢒꢵꢯ꣄ ꢔꢾꢖ꣄ꢔꣁ
अकाष् ग॑ङगा॑
ꢂꢒꢵꢱ꣄
अकास
ꢮꢵꢦ꣄
वाप्
ꢦꢮꢶ / ꢦꢶꢞꢸ
पवि / पिडु
ꢲꢥ꣄ꢣꢵꢬ꣄ / ꢔꢾꢮꢶ
हन्दार् / ग॑वि
ꢆꢣꢫꢪ꣄ / ꢱꢸꢬꢶꢡꢸ ꢥꢶꢒꢶꢭ꣄ꢥꢶ
उदयम् / सुरितु निकिल्नि
ꢙꢵꢳꢸꢗꢸꢒ꣄ꢒꣁ
जाळुचुक्का॑
ꢂꢔꢗꢵꢭ꣄ ꢂꢫ꣄ꢣꢸ / ꢦ꣄ꢬꢒ꣄ꢰꢾꢦꢥꣁ
अगचाल्अय्दु / प्रक्षेपना॑
ꢕꢶꢬꢵꢠ꣄
घिराण
ꢔꣁꢳ꣄꣄
गोळ
ꢒꢶꢬꢠ꣄
किरण्
ꢒꢿꢡꢸ
केतु
ꢗꢥ꣄ꢣ꣄ꢬ ꢕ꣄ꢬꢵꢠ꣄ / ꢗꢵꢥ꣄ꢣꢸ ꢕ꣄ꢬꢵꢠ꣄ / ꢗꢾꢥ꣄ꢣꢵꢪꢸ ꢕ꣄ꢬꢵꢠ꣄
चन्दर घ्राण / चान्दु घ्राण / चेन्दामु घ्राण
ꢗꢾꢥ꣄ꢣꢵꢪ꣄ / ꢗꢵꢥ꣄ꢣꢸ
चेन्दाम / चान्दु
ꢱ꣄ꢥꢶ / ꢱꢾꢥꢶ
सनि / स॑नि
ꢱꢸꢒ꣄ꢒꢸꢬ꣄
सुक्कुर
ꢱꢸꢳꢶꢮꢬꣂ
सुळिवरा॑
ꢱꢹꢬ꣄ꢫ ꢕ꣄ꢬꢵꢠ꣄
सूर्य घ्राण
ꢱꢸꢬꢶꢡꢸ ꢪꢠ꣄ꢞꢭ꣄ / ꢱꢹꢬ꣄ꢫ ꢪꢠ꣄ꢞꢭ꣄
सूरितु मण्डल / सुर्य मण्डल
ꢱꢸꢬꢶꢡ꣄ / ꢩꢵꢥꢸ
सुरित / भानु
ꢆꢦꢨ꣄ꢬꢲꣁ
उपग्रहा॑
ꢪꢖ꣄ꢔꢳ꣄ ꢔ꣄ꢬꢲꣁ
मङ्गळ ग्रहा॑
ꢱꢸꢬꢶꢡ / ꢩꢵꢥꢸ
सुरित / भानु
ꢱꢬꢔ꣄ꢬꢲꣁ
सहग्रहा॑
ꢗꢶꢥꢸꢒ꣄ / ꢗꢶꢖ꣄ꢒꢸꢭ꣄
चिनुक / चिङ्कुल
ꢪꢵꢬꢸꢡ꣄
मारुत
ꢗꢸꢒ꣄ꢒꣁ
चुक्को
ꢥꣁꢮ꣄ꢔꢶꢬꢲꢵꢥ꣄
ना॑व्गिरहान
ꢗꢾꢥ꣄ꢣꢵꢪꢸ ꢲꢹꢙꢵꢭ꣄ / ꢗꢥ꣄ꢣ꣄ꢬꢶꢒꣁ / ꢗꢥ꣄ꢣ꣄ꢬ ꢦ꣄ꢬꢩꣁ / ꢒꣃꢪꢸꢣꢶ
चेन्दाम्हुजाल् / चन्द्रिका॑ / चन्द्र प्रभा॑ / कौमुदि
ꢗꢾꢥ꣄ꢡꢵꢪ꣄ / ꢗꢵꢥ꣄ꢣꢸ / ꢄꢥ꣄ꢣꢸ
चेन्ताम् / चान्दु / इन्दु
ꢗꢥ꣄ꢣ꣄ꢬꢫꢵꢥ꣄
चन्द्रयान
ꢮꢵꢦ꣄
वाप्
ꢬꢸꢡꢸꢮꢬꣁ
रुतुवरा॑
ꢬꢸꢡꢸꢦꣁꢮ꣄ꢱ꣄
रुतुपा॑व्स
ꢪꣁꢖ꣄ꢗꢸ
मा॑ञ्चु
ꢲꢶꢪꢵ ꢔꢾꢞ꣄ꢞꣁ
हिमा ग॑ड्डा॑
ꢲꢶꢪꢵ ꢨꢶꢥ꣄ꢣꢸ / ꢐꢱꢸ ꢨꢶꢥ꣄ꢣꢸ
हिमा बिन्दु / ओसु बिन्दु
ꢨꢸꢤꣁ / ꢨꢸꢤꣁ ꢔ꣄ꢬꢲꣁ
बुधा॑ / बुद्ग ग्रहा॑
ꢱꢸꢳꢶ ꢮꢬꣁ
सुळि वरा॑
ꢩꢹ ꢃꢒꢬ꣄ꢰꢠ ꢯꢒ꣄ꢡꢶ
भू आकर्षण शक्ति
ꢪꢡ꣄ꢡꢶ ꢮꢬꣁ
मत्ति वरा॑
ꢦꣁꢮ꣄ꢱ꣄
पा॑व्स्
ꢂꢱ꣄ꢡꢪꢵꢥ꣄
अस्तमान्
ꢮꢶꢣ꣄ꢫꢸꢡ꣄
विद्युत
ꢪꢿꢕ꣄꣄
मेघ
ꢪꣁꢨ꣄ꢨꢸ
मा॑ब्बु
ꢬꢵꢲꢸ
राहु
ꢮꢬꣁ
वरा॑
ꢦꢹꢱꢸ ꢗꢸꢒ꣄ꢒꣁ
पूसु चुक्को
ꢂꢒꢵꢰ꣄ / ꢲꢨꢵꢳ꣄
अकास / हबाळ
ꢂꢒꢵꢱꢸ ꢮꢖ꣄ꢒꢜ꣄ / ꢂꢒꢵꢱꢸ ꢤꢥꢸꢱ꣄ / ꢄꢥ꣄ꢣ꣄ꢬ ꢤꢥꢸꢱ꣄
अकासु वङ्कट / अकासु धनुस / इन्दर थनुस
ꢮꢶꢫꣁꢪꢥ꣄ / ꢱꢸꢥ꣄ꢫ ꢂꢒꢵꢱ꣄
वियोमन / सुन्य अकास



You are a fluent Sourashtra language AI assistant. Your purpose is to help preserve and teach the Sourashtra language.

RULES:

Respond in English and Sourashtra. If user's request is in english, respond in english and assist them with the response. If the request is in sourashtra, respond in sourashtra and assist them with the response. DO NOT USE ANY OTHER LANGUAGE!

Use English when the user asks for translation or when explaining a concept that Sourashtra does not have words for.


Be patient, friendly, and culturally aware.

IMPORTANT : USE MUST USE THE SOURASHTRA DICTIONARY TO UNDERSTAND THE LANGUAGE!

Help users learn vocabulary, phrases, conversation, culture, and translation.

Speak like a supportive family member teaching the language.

Your goal is to preserve the Sourashtra language and make learning enjoyable.`;

// Chat endpoint with streaming (supports multimodal: images, videos, files)
router.post('/chat', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { message, history = [], attachments = [] } = req.body;

    console.log('Chat request received:', { 
      message, 
      historyLength: history.length,
      attachmentsCount: attachments.length 
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Helper to build parts array for a message
    const buildParts = (content, msgAttachments = []) => {
      const parts = [];
      
      // Add attachments first (Gemini prefers media before text)
      for (const att of msgAttachments) {
        if (att.data && att.mimeType) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data // base64 encoded
            }
          });
        }
      }
      
      // Add text content
      if (content) {
        parts.push({ text: content });
      }
      
      return parts;
    };

    // Build contents with proper role mapping and attachments
    const contents = [
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: buildParts(msg.content, msg.attachments)
      })),
      { 
        role: 'user', 
        parts: buildParts(message, attachments)
      }
    ];

    const response = await ai.models.generateContentStream({
      model: MODELS.chat,
      contents: contents,
      config: {
        systemInstruction: SOURASHTRA_SYSTEM_INSTRUCTION,
      }
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Simple chat (non-streaming)
router.post('/chat/simple', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { message, history = [] } = req.body;

    const contents = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: MODELS.chat,
      contents: contents,
      config: {
        systemInstruction: SOURASHTRA_SYSTEM_INSTRUCTION,
      }
    });

    res.json({ text: response.text, success: true });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Image generation endpoint
router.post('/generate-image', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { 
      prompt, 
      aspectRatio = '1:1',
      resolution = '1K',
      style = 'default'
    } = req.body;

    let enhancedPrompt = prompt;
    
    if (style === 'cultural') {
      enhancedPrompt = `${prompt}. Include authentic Sourashtra/South Indian cultural elements, traditional patterns, and vibrant colors.`;
    } else if (style === 'photorealistic') {
      enhancedPrompt = `${prompt}. Photorealistic, high quality, detailed, professional photography style.`;
    } else if (style === 'artistic') {
      enhancedPrompt = `${prompt}. Artistic style with creative interpretation, beautiful colors and composition.`;
    }

    console.log(`Generating image: ${enhancedPrompt} | Aspect: ${aspectRatio} | Resolution: ${resolution}`);

    const response = await ai.models.generateContent({
      model: MODELS.image,
      contents: enhancedPrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution,
        },
      }
    });

    // Parse response - check both old and new response formats
    let imageData = null;
    let text = '';
    
    // Try new format first (response.candidates)
    const parts = response.candidates?.[0]?.content?.parts || response.parts || [];

    for (const part of parts) {
      if (part.text) {
        text = part.text;
      } else if (part.inlineData) {
        imageData = {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType
        };
      }
    }

    res.json({ 
      success: true,
      imageData,
      text,
      enhancedPrompt,
      settings: { aspectRatio, resolution, style }
    });

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Image editing endpoint
router.post('/edit-image', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { 
      prompt, 
      imageData,
      imageMimeType = 'image/png',
      aspectRatio = '1:1',
      resolution = '1K'
    } = req.body;

    const response = await ai.models.generateContent({
      model: MODELS.image,
      contents: [
        { inlineData: { mimeType: imageMimeType, data: imageData } },
        { text: prompt }
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        imageConfig: { aspectRatio, imageSize: resolution },
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || response.parts || [];
    let resultImageData = null;
    let text = '';

    for (const part of parts) {
      if (part.text) text = part.text;
      else if (part.inlineData) {
        resultImageData = { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
      }
    }

    res.json({ success: true, imageData: resultImageData, text });
  } catch (error) {
    console.error('Image editing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Voice respond endpoint (text-to-text, client handles TTS)
// Note: For real-time audio streaming, use the Live API directly from client
// with WebSockets. Cloud Functions can't maintain persistent WebSocket connections.
router.post('/voice/respond', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { message, history = [] } = req.body;

    const contents = [
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    // Use chat model for voice responses - keep them concise
    const voiceSystemInstruction = SOURASHTRA_SYSTEM_INSTRUCTION + `

VOICE RESPONSE GUIDELINES:
- Keep responses SHORT and CONCISE (1-3 sentences max)
- Use simple, conversational language
- Avoid complex sentences or long explanations
- Be warm and encouraging
- Respond naturally as if speaking in a conversation`;

    const response = await ai.models.generateContent({
      model: MODELS.chat,
      contents: contents,
      config: {
        systemInstruction: voiceSystemInstruction,
      }
    });

    res.json({ text: response.text, success: true });
  } catch (error) {
    console.error('Voice respond error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create token for Live API (client-side WebSocket connection)
// Returns API key directly since ephemeral tokens require specific setup
router.post('/live/token', async (req, res) => {
  try {
    const key = geminiApiKey.value();
    if (!key) {
      console.error('GEMINI_API_KEY secret not configured');
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }

    const now = new Date();
    const expireTime = new Date(now.getTime() + (30 * 60 * 1000)); // 30 minutes from now

    // Voice-specific system instruction in English
    const voiceSystemInstruction = `You are a friendly Sourashtra language AI assistant helping preserve and teach the Sourashtra language.

IMPORTANT: Always respond in ENGLISH. You are helping users learn Sourashtra, so explain things in English.

Your role:
- Help users learn Sourashtra vocabulary and phrases
- Explain Sourashtra words and their meanings in English
- Practice conversation and pronunciation
- Share Sourashtra culture and traditions
- Translate between Sourashtra and English

When teaching Sourashtra words, say them phonetically in English so users can understand the pronunciation.

VOICE MODE RULES:
- Keep responses SHORT (1-3 sentences max)
- Sound natural and conversational
- Be warm, encouraging, and patient
- You're like a friendly family member teaching the language

Remember: You are helping preserve a 2000+ year old heritage language. "Avre bhashai avre perumai" - Our language is our pride.`;

    res.json({ 
      success: true, 
      token: key,
      model: `models/${MODELS.live}`,
      expireTime: expireTime.toISOString(),
      systemInstruction: voiceSystemInstruction
    });
  } catch (error) {
    console.error('Live token error:', error);
    res.status(500).json({ success: false, error: error.message || 'Unknown error' });
  }
});

// Generate chat name from conversation history
router.post('/generate-chat-name', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { messages } = req.body;

    if (!messages || messages.length < 2) {
      return res.json({ name: 'New Chat', success: true });
    }

    // Take first few messages for context
    const context = messages.slice(0, 6).map(m => 
      `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 200)}`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: MODELS.chatLite,
      contents: `Based on this conversation, generate a very short chat title (2-5 words max). Just return the title, nothing else.

Conversation:
${context}

Title:`,
    });

    const name = response.text?.trim().replace(/^["']|["']$/g, '') || 'New Chat';
    res.json({ name: name.substring(0, 50), success: true });
  } catch (error) {
    console.error('Generate chat name error:', error);
    res.json({ name: 'New Chat', success: true });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), models: MODELS });
});

// Generate password reset link endpoint
router.post('/auth/generate-reset-link', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Check if user exists
    try {
      await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ success: false, error: 'No account found with this email' });
      }
      throw error;
    }

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      url: 'https://sourashtra-ai.web.app/signin',
      handleCodeInApp: false
    });

    res.json({ 
      success: true, 
      resetLink,
      message: 'Password reset link generated successfully'
    });

  } catch (error) {
    console.error('Generate reset link error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mount router at /api
app.use('/api', router);

// Export the Express app as a Firebase Function
export const api = onRequest(
  { 
    secrets: [geminiApiKey],
    memory: '1GiB',
    timeoutSeconds: 300,
    cors: true
  }, 
  app
);

