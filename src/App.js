import React, { useState, useEffect } from "react";
import * as Realm from "realm-web";
import { useTransition, animated } from 'react-spring';

const app = new Realm.App({ id: "application-0-oolcn" });

function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;

  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  return Math.floor(seconds) + " seconds ago";
}

const App = () => {
  const [user, setUser] = useState();
  const [displayEvents, setDisplayEvents] = useState([]);

  useEffect(() => {
    const login = async () => {
      const user = await app.logIn(Realm.Credentials.anonymous());
      setUser(user);
  
      const mongodb = app.currentUser.mongoClient("mongodb-atlas");
      const collection = mongodb.db("apibara-example").collection("swaps");
  
      for await (const change of collection.watch()) {
        setDisplayEvents(displayEvents => [change, ...displayEvents]); // Prepend to trigger animation
        console.log("displayEvents", displayEvents);
      }
    }
    login();
  }, []);

  // Animation transitions
  const transitions = useTransition(displayEvents, {
    from: { transform: 'translate3d(0,-40px,0)', opacity: 0 },
    enter: { transform: 'translate3d(0,0px,0)', opacity: 1 },
    leave: { transform: 'translate3d(0,-40px,0)', opacity: 0 },
    keys: displayEvents.map((item, index) => index),
  });

  return (
    <div className="App">
      {!!user &&
        <div className="App-header">
          <h1>Connected as user {user.id}</h1>
          <div>
            <p>Latest events:</p>
            <table>
              <thead>
                <tr>
                  <td>Operation</td>
                  <td>Document Key</td>
                  <td>Full Document</td>
                  <td>Time Ago</td> 
                  </tr>
              </thead>
              <tbody>
                {transitions((style, item, t, index) => (
                  <animated.tr key={index} style={style}>
                    <td>{item.operationType}</td>
                    <td>{item.documentKey._id.toString()}</td>
                    <td>{JSON.stringify(item.fullDocument)}</td>
                    {item.fullDocument ? <td>{timeSince(new Date(item.fullDocument.block_time.seconds.low * 1000))}</td> : <td>N/A</td>}
                    {/*
                    <td>{item.fullDocument.block_time ? timeSince(new Date(item.fullDocument.block_time.seconds.low * 1000)) : 'N/A'}</td> 
                    */}

                  </animated.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  );
};

export default App;