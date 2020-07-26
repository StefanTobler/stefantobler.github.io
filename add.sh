#!/bin/sh

#
# This script is to add content to the website based on the format of the CTF repo folders. This script will expect that there is an image
# representing the write-up in images/info.png. It also expects that there is a file called start which contains the date that the challenge
# was started.
#
# This script assumes that it is in the root directory of a hugo project.
#


TARGET=""
FILE=""

prepend() { 
    cat - $TARGET/$FILE.md > temp && mv temp $TARGET/$FILE.md
}

add_tags() {
    # DOES NOT WORK WITH SPACED WORDS 'TAG 2'
    TAGS=$(echo $1 | tr "," "\n")
    for TAG in $TAGS
    do
        echo - $TAG | prepend
    done
}

add_image() {
    if [[ $1 -ne 1 ]]; then
        echo hero: $2 | prepend
    fi
}

add_hidden() {
    if [[ $1 -eq 1 ]]; then
        echo "bookHidden: true" | prepend
        echo "This post has been hidden."
        echo 
    fi
}

# Transform long options to short ones
# Source: https://stackoverflow.com/a/30026641/7090365

for arg in "$@"; do
  shift
  case "$arg" in
    "--no-image") set -- "$@" "-n" ;;
    "--help") set -- "$@" "-h" ;;
    "--category") set -- "$@" "-c" ;;
    "--tags") set -- "$@" "-t" ;;
    "--hidden") set -- "$@" "-q" ;;
    "--verbose") set -- "$@" "-v" ;;
    "--date") set -- "$@" "-d" ;;
    "--image") set -- "$@" "-i" ;;
    *)        set -- "$@" "$arg"
  esac
done

# end of stackover flow forgery ;)

CATEGORY="misc"
DATE="2020-01-01"
IMAGE="hero.png"
NOIMAGE=0

# getopts part
while getopts ":hnc:t:qvd:x:" opt; do
  case ${opt} in
    h )
        echo
        echo "Usage:"
        echo "    ./add.sh [options] [path_to_challenge_folder] [path_to_post]"
        echo
        echo "Flags:"
        echo "    -h, --help              Display this help message."
        echo "    -n, --no-image          Do not look for image folder."
        echo "    -c, --category string   Specify the category for this post. (Defaults to 'misc')"
        echo "    -t, --tags string       A comma seperated list of tags. Surround multi-word tags in single quotes." 
        echo "                            The first tag should be the machines OS."
        echo "    --hidden                Makes the blog post hidden on the menu."
        echo "    -v, --verbose           Makes the output verbose."
        echo "    -d, --date YYYY-MM-DD   Specify the date of the post in the following format YYYY-MM-DD."
        echo "    -i, --image             Specify image name inside the SOURCE/images directory, defaults to 'hero.png'."
        echo
        echo "Example:"
        echo "    ./add.sh /home/ctf/Documents/ctf/challenge1 content/posts/hack-the-box"
        echo "    ./add.sh -c hack-the-box --tags 'session jacking','cron jobs',windows /home/hackerman/super_hard_box content/posts/box_challenges"
        echo
        exit 0
        ;;
    n )
        NOIMAGE=1
        ;;
    c )
        CATEGORY=$OPTARG
        ;;
    t ) 
        TAGS=$OPTARG
        # Consider reworking this to allow for -t tag1 tag2 tag3
        ;;
    q )
        HIDDEN=1
        ;;
    v )
        VERBOSE=1
        ;;
    d )
        DATEFLAG=1
        DATE=$OPTARG
        ;;
    i )
        IMAGE=$OPTARG
        ;;
    \? )
      echo "Invalid Option: -$OPTARG" 1>&2
      exit 1
      ;;
    esac
done
shift $((OPTIND -1))

if [[ -z "$1" ]]; then
    echo "Source path not supplied."
    exit 1
elif [[ -z "$2" ]]; then
    echo "Target path not supplied."
    exit 1
fi

# TODO: Check that the source is valid
SOURCE=$1
TARGET=$2

if [ !  -d $SOURCE ]; then
    echo "Source folder does not exist!"
    exit 1
elif [ ! -f "$SOURCE/methodology.md" ]; then
    echo "Cannot find the methodology.md file. Make sure that your source has a methodology.md file."
    exit 1
fi

# Make the target folder if it does not exist and suppress error if it exists already.
# mkdir -p $TARGET

TITLE=$(head -n 1 $SOURCE/methodology.md | sed 's/# //' | sed 's/ Methodology//')
FILE=$(echo $TITLE | tr '[:upper:]' '[:lower:]' | tr '[ ]' '[_]')

# Copy methodology to target 
cp $SOURCE/methodology.md $TARGET/$FILE.md
if [[ VERBOSE -eq 1 ]]; then 
    echo "Created $TARGET/$FILE.md"
    echo
fi

# Remove Title
echo "$(tail -n +3 $TARGET/$FILE.md)" > $TARGET/$FILE.md

# Grab date from start folder
if [[ -f "$SOURCE/start" ]] && [[ "$DATEFLAG" -ne 1 ]]; then
    DATE=$(cat $SOURCE/start)
fi

if [[ $NOIMAGE -ne 1 ]]; then 
    if [[ VERBOSE -eq 1 ]]; then
        echo "Getting post image."
        echo
    fi
    if [[ ! -f $SOURCE/images/$IMAGE ]]; then
        NOIMAGE=1
        echo "Hero image not found, continuing without hero image."
        echo
    else
        echo "Hero image found."
        echo
        EXTENSION="${IMAGE##*.}"
        mkdir -p static/images/$TARGET
        cp $SOURCE/images/$IMAGE static/images/$TARGET/$FILE.$EXTENSION
        IMAGE="/images/$TARGET/$FILE.$EXTENSION"
    fi
fi

if [[ VERBOSE -eq 1 ]]; then 
    echo "Adding metadata to post..."
    echo
fi

# Yes I realize there is a sed oneliner for this but I could not get it to work on my mac.
echo --- | prepend
add_hidden $HIDDEN
add_tags $TAGS
echo tags: | prepend
echo - $CATEGORY | prepend
echo categories: | prepend
add_image $NOIMAGE $IMAGE 
echo date: $DATE | prepend
echo title: $TITLE | prepend
echo --- | prepend

echo "Write up has been posted."
