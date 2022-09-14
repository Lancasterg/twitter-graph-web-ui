NEO4J_ROOT=`dirname "$0"`/neo4j-community-3.5.3

echo "Starting embedded Neo4J server..."
$NEO4J_ROOT/bin/neo4j start

if [ ! -f $NEO4J_ROOT/data/dbms/auth ]; then
    echo "Setting initial password"
    sleep 5
    $NEO4J_ROOT/bin/cypher-shell -u neo4j -p neo4j "CALL dbms.changePassword('password')"
fi