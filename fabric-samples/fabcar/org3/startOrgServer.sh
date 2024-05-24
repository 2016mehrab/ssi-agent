pushd ../../test-network/addOrg3/docker/
docker-compose -f docker-compose-ca-org3.yaml up -d
docker-compose -f docker-compose-couch-org3.yaml up -d
docker-compose -f docker-compose-org3.yaml up -d
popd

echo Enrolling Admin
node enrollAdmin.js
echo Registering User
node registerUser.js
echo Starting Server
npm start