// Realistic crop & soil imagery registry
import rice from "@/assets/crops/rice.jpg";
import wheat from "@/assets/crops/wheat.jpg";
import maize from "@/assets/crops/maize.jpg";
import cotton from "@/assets/crops/cotton.jpg";
import sugarcane from "@/assets/crops/sugarcane.jpg";
import barley from "@/assets/crops/barley.jpg";
import millet from "@/assets/crops/millet.jpg";
import pulses from "@/assets/crops/pulses.jpg";
import soybean from "@/assets/crops/soybean.jpg";
import groundnut from "@/assets/crops/groundnut.jpg";
import mustard from "@/assets/crops/mustard.jpg";
import tea from "@/assets/crops/tea.jpg";
import coffee from "@/assets/crops/coffee.jpg";
import jute from "@/assets/crops/jute.jpg";
import tobacco from "@/assets/crops/tobacco.jpg";
import potato from "@/assets/crops/potato.jpg";
import onion from "@/assets/crops/onion.jpg";
import tomato from "@/assets/crops/tomato.jpg";
import chili from "@/assets/crops/chili.jpg";
import banana from "@/assets/crops/banana.jpg";
import mango from "@/assets/crops/mango.jpg";
import coconut from "@/assets/crops/coconut.jpg";
import turmeric from "@/assets/crops/turmeric.jpg";

import sandy from "@/assets/soils/sandy.jpg";
import clay from "@/assets/soils/clay.jpg";
import loamy from "@/assets/soils/loamy.jpg";
import red from "@/assets/soils/red.jpg";
import black from "@/assets/soils/black.jpg";
import alluvial from "@/assets/soils/alluvial.jpg";
import laterite from "@/assets/soils/laterite.jpg";
import desert from "@/assets/soils/desert.jpg";

export const cropImages: Record<string, string> = {
  rice, wheat, maize, cotton, sugarcane,
  barley, millet, pulses, soybean, groundnut, mustard,
  tea, coffee, jute, tobacco, potato, onion, tomato, chili,
  banana, mango, coconut, turmeric,
};

export const soilImages: Record<string, string> = {
  sandy, clay, loamy, red, black, alluvial, laterite, desert,
};
