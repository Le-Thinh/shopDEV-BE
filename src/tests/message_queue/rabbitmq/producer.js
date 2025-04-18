const amqp = require("amqplib");
const message = "New  Product: Title......";

const runProducer = async () => {
  try {
    const connection = await amqp.connect(
      "amqp://guest:Mwshwmf070804@localhost"
    );
    const channel = await connection.createChannel();
    const queueName = "test-topic";
    await channel.assertQueue(queueName, {
      durable: true,
    });

    //   send message to consumer
    channel.sendToQueue(queueName, Buffer.from(message));
    console.log(`message sent: `, message);

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error(error);
  }
};

runProducer().catch(console.error);
