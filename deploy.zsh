if [[ $(git status --porcelain) ]]; then
echo "****************"
echo "Please commit changes first"
echo "****************"
exit 0
fi

source ./login.zsh || exit 1

yarn version --patch;
git com "version bump";
git pushme;
serverless deploy