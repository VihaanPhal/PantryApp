"use client";
import * as React from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import {
  Box,
  Button,
  Stack,
  Typography,
  Modal,
  TextField,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
} from "@mui/material";
import { firestore } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "none",
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

export default function Home() {
  const [pantry, setPantry] = useState([]);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const updatePantry = async () => {
    const pantryitems = [];
    const pantryCollection = query(collection(firestore, "Pantry"));
    const docs = await getDocs(pantryCollection);
    docs.forEach((doc) => {
      pantryitems.push({ name: doc.id, quantity: doc.data().quantity });
    });
    setPantry(pantryitems);
  };

  useEffect(() => {
    updatePantry();
  }, []);

  const addItem = async (item, quantity) => {
    if (!item || !quantity) return;
    try {
      const docRef = doc(collection(firestore, "Pantry"), item);
      await setDoc(docRef, { quantity: parseInt(quantity, 10) });
      updatePantry();
      setItemName(""); // Clear input fields after adding item
      setQuantity("");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const removeItem = async (item) => {
    try {
      const docRef = doc(collection(firestore, "Pantry"), item);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentQuantity = docSnap.data().quantity;
        if (currentQuantity > 1) {
          await setDoc(docRef, { quantity: currentQuantity - 1 });
        } else {
          await deleteDoc(docRef);
        }
        updatePantry();
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error updating/deleting document: ", error);
    }
  };

  const classifyImage = async () => {
    if (!image) return;
    setLoading(true);

    const imgElement = document.createElement("img");
    imgElement.src = URL.createObjectURL(image);
    document.body.appendChild(imgElement); // Attach imgElement to the DOM to ensure it loads

    imgElement.onload = async () => {
      const model = await cocoSsd.load();
      const predictions = await model.detect(imgElement);

      if (predictions.length > 0) {
        const detectedItems = predictions.map((prediction) => prediction.class);
        for (const item of detectedItems) {
          const existingItem = pantry.find(
            (p) => p.name.toLowerCase() === item.toLowerCase()
          );
          if (existingItem) {
            await setDoc(doc(collection(firestore, "Pantry"), item), {
              quantity: existingItem.quantity + 1,
            });
          } else {
            await setDoc(doc(collection(firestore, "Pantry"), item), {
              quantity: 1,
            });
          }
        }
        updatePantry();
      }
      setLoading(false);
      URL.revokeObjectURL(imgElement.src); // Clean up the object URL
      document.body.removeChild(imgElement); // Remove imgElement from the DOM
      setImage(null); // Reset image state
    };
  };

  const handleImageUpload = (event) => {
    setImage(event.target.files[0]);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      bgcolor="#f5f5f5"
      p={2}
    >
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <TextField
            id="item-name"
            label="Item Name"
            variant="filled"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <TextField
            id="quantity"
            label="Quantity"
            variant="filled"
            fullWidth
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={() => {
              addItem(itemName, quantity);
              handleClose();
            }}
            sx={{ mt: 2 }}
          >
            Save
          </Button>
        </Box>
      </Modal>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        Add Item
      </Button>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: "none" }}
        id="upload-image"
      />
      <label htmlFor="upload-image">
        <Button
          variant="contained"
          color="primary"
          component="span"
          sx={{ mb: 2 }}
        >
          Upload Image
        </Button>
      </label>
      <Button
        variant="contained"
        color="primary"
        onClick={classifyImage}
        sx={{ mb: 2 }}
        disabled={loading || !image}
      >
        {loading ? <CircularProgress size={24} /> : "Add via image"}
      </Button>
      <Box
        width="800px"
        bgcolor="#00796b"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="8px 8px 0 0"
        boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)"
        mb={2}
        p={2}
      >
        <Typography variant="h4" color="#fff" textAlign="center">
          Pantry Items
        </Typography>
      </Box>
      <Stack
        width="800px"
        height="400px"
        spacing={2}
        overflow="auto"
        sx={{
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          borderRadius: "0 0 8px 8px",
          bgcolor: "#fff",
          p: 2,
          border: "2px solid #00796b",
          boxSizing: "border-box",
        }}
      >
        {pantry.length > 0 ? (
          pantry.map((item) => (
            <Card
              key={item.name}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
              }}
            >
              <CardContent>
                <Typography variant="h6" color="#333">
                  {item.name.charAt(0).toUpperCase() + item.name.slice(1)} -{" "}
                  {item.quantity}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => removeItem(item.name)}
                >
                  Decrement
                </Button>
              </CardActions>
            </Card>
          ))
        ) : (
          <Typography variant="h6" color="#333" textAlign="center">
            No items found
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
